import { useEffect, useRef, useState } from 'react';
import { IconRestore } from '@tabler/icons-react';
import { IconArrowBackUp } from '@tabler/icons-react';
import { IconBlur } from '@tabler/icons-react';
import { IconEraser } from '@tabler/icons-react';
import { IconDownload } from '@tabler/icons-react';
import { IconPlus } from '@tabler/icons-react';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { IconTrash } from '@tabler/icons-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Button, Toast, ToastContainer } from 'react-bootstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import { v4 as uuidv4 } from 'uuid';
import { SavedImage } from '../../models/SavedImage';
import './Home.css';
import { useSessionStorage } from '../../hooks/userSessionStorage';

export const Home = () => {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const cursorCanvas = useRef<HTMLCanvasElement | null>(null);

  const [down, setDown] = useState(false);
  const [eraser, setEraser] = useState(false);
  const [blur, setBlur] = useState(false);

  const [canvasForEraser, setCanvasForEraser] = useState<HTMLCanvasElement | null>(null);
  const [canvasForBlur, setCanvasForBlur] = useState<HTMLCanvasElement | null>(null);
  const [history, setHistory] = useLocalStorage<SavedImage[]>('imagesHistory', []);
  const [savedImages, setSavedImages] = useSessionStorage<SavedImage[]>('savedImages', []);
  const [savedMainCanvas, setSavedMainCanvas] = useLocalStorage<SavedImage | null>('savedMainImage', null);
  const [showToast, setShowToast] = useState(false);

  const [image, setImage] = useLocalStorage<SavedImage | null>('mainImage', null);

  useEffect(() => {
    if (image) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = image.imageData;
      if (savedMainCanvas) {
        const savedImage = new Image();
        savedImage.crossOrigin = 'anonymous';
        savedImage.src = savedMainCanvas.imageData;
        savedImage.onload = () => loadImage(savedImage, false);
      } else {
        img.onload = () => loadImage(img, true);
      }
    } else {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = 'https://media.istockphoto.com/id/172647021/photo/school-busses.jpg?s=612x612&w=0&k=20&c=JKEfzXfHDsGzC00k2469jvyf4she4mxBS200_mB-Eg4=';
      if (savedMainCanvas) {
        const savedImage = new Image();
        savedImage.crossOrigin = 'anonymous';
        savedImage.src = savedMainCanvas.imageData;
        savedImage.onload = () => loadImage(savedImage, false);
      } else {
        img.onload = () => loadImage(img, true);
      }
    }
  }, []);

  function loadImage(img: HTMLImageElement, storage: boolean) {
    if (storage) setImage({ imageData: img.src, width: img.width, height: img.height });

    // Set width and height in all canvas
    canvas.current!.width = cursorCanvas.current!.width = img.width;
    canvas.current!.height = cursorCanvas.current!.height = img.height;

    // Initialize loaded image in main canvas
    canvas.current!.getContext('2d')!.clearRect(0, 0, canvas.current!.width, canvas.current!.height);
    canvas.current!.getContext('2d')!.drawImage(img, 0, 0);

    // Initialize loaded image in eraser canvas
    const temporaryEraserCanvas = document.createElement('canvas');
    temporaryEraserCanvas.width = img.width;
    temporaryEraserCanvas.height = img.height;
    temporaryEraserCanvas.getContext('2d')!.drawImage(img, 0, 0);
    setCanvasForEraser(temporaryEraserCanvas);

    // Initialize loaded image in blur canvas
    const temporaryBlurCanvas = document.createElement('canvas');
    temporaryBlurCanvas.width = img.width;
    temporaryBlurCanvas.height = img.height;
    temporaryBlurCanvas.getContext('2d')!.filter = "blur(4px)";
    setCanvasForBlur(temporaryBlurCanvas);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!blur) return;
    setDown(true);

    // Clear blur canvas for new blur shapes
    canvasForBlur!.getContext('2d')!.clearRect(0, 0, canvasForBlur!.width, canvasForBlur!.height);

    // Add current image to history
    addHistory();
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!blur) return;
    setDown(false);

    const blurCtx = canvasForBlur!.getContext('2d')!;
    const ctx = canvas.current!.getContext('2d')!;

    // Clear brush when stopping to blur
    cursorCanvas.current!.getContext('2d')!.clearRect(0, 0, cursorCanvas.current!.width, cursorCanvas.current!.height);

    // Capture part of blurred image
    blurCtx.save();
    blurCtx.globalCompositeOperation = 'source-in';
    blurCtx.drawImage(canvasForEraser as CanvasImageSource, 0, 0);
    blurCtx.restore();

    // Draw part of blurred image on top of main image
    ctx.save();
    ctx.drawImage(canvasForBlur as CanvasImageSource, 0, 0);

    setSavedMainCanvas({ imageData: canvas.current!.toDataURL('image/png'), width: canvas.current!.width, height: canvas.current!.height });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!blur || !down) return;

    const cursorCtx = cursorCanvas.current!.getContext('2d')!;
    const blurCtx = canvasForBlur!.getContext('2d')!;

    const mouseX = e.clientX - cursorCanvas.current!.getBoundingClientRect().left;
    const mouseY = e.clientY - cursorCanvas.current!.getBoundingClientRect().top;

    // Draw a line in cursor canvas
    cursorCtx.beginPath();
    cursorCtx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
    cursorCtx.closePath();
    cursorCtx.fill();

    // Draw a line in blur canvas
    blurCtx.beginPath();
    blurCtx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
    blurCtx.closePath();
    blurCtx.fill();
  }

  function handleMouseMoveMainCanvas(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!eraser || !down) return;

    const ctx = canvas.current!.getContext('2d')!;
    const eraserCtx = canvasForEraser!.getContext('2d')!;

    const mouseX = e.clientX - canvas.current!.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.current!.getBoundingClientRect().top;

    // Draw a line in main canvas
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Draw a line in eraser canvas
    eraserCtx.globalCompositeOperation = 'destination-out';
    eraserCtx.beginPath();
    eraserCtx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
    eraserCtx.closePath();
    eraserCtx.fill();
    eraserCtx.globalCompositeOperation = 'source-over';
  }

  function handleMouseDownMainCanvas(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!eraser) return;
    setDown(true);

    // Add current image to history
    addHistory();
  }

  function handleMouseUpMainCanvas(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!eraser) return;
    setDown(false);
    setSavedMainCanvas({ imageData: canvas.current!.toDataURL('image/png'), width: canvas.current!.width, height: canvas.current!.height });
  }

  function addHistory() {
    const temporaryCanvas = document.createElement('canvas');
    temporaryCanvas.width = image!.width!;
    temporaryCanvas.height = image!.height!;
    temporaryCanvas.getContext('2d')!.drawImage(canvas.current as CanvasImageSource, 0, 0);

    setHistory([...history, { imageData: temporaryCanvas.toDataURL('image/png'), width: temporaryCanvas.width, height: temporaryCanvas.height }]);
  }

  function toggleEraserMode() {
    setEraser(state => !state);
    setBlur(false);
  }

  function toggleBlurMode() {
    setBlur(state => !state);
    setEraser(false);
  }

  function undo() {
    if (history.length) {
      const imageFromHistory = history.slice().reverse()[0];
      setHistory(history.slice(0, history.length - 1));

      const dynamicImage = document.createElement('img');
      dynamicImage.src = imageFromHistory.imageData;
      dynamicImage.width = imageFromHistory.width!;
      dynamicImage.height = imageFromHistory.height!;
      dynamicImage.onload = function() {
        // Draw last change into main canvas
        const ctx = canvas.current!.getContext('2d')!;
        canvas.current!.width = dynamicImage.width!;
        canvas.current!.height = dynamicImage.height!;
        ctx.clearRect(0, 0, dynamicImage.width!, dynamicImage.height!);
        ctx.drawImage(dynamicImage, 0, 0);

        setSavedMainCanvas({ imageData: canvas.current!.toDataURL('image/png'), width: canvas.current!.width, height: canvas.current!.height });

        // Draw last change into eraser canvas
        const eraserCtx = canvasForEraser!.getContext('2d')!;
        canvasForEraser!.width = dynamicImage.width!;
        canvasForEraser!.height = dynamicImage.height!;
        eraserCtx.clearRect(0, 0, dynamicImage!.width, dynamicImage!.height);
        eraserCtx.drawImage(dynamicImage, 0, 0);
      }
    } else {
      setShowToast(true);
    }
  }

  function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files![0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function(e) {
        const img = new Image();
        img.src = e.target!.result as string;
        img.crossOrigin = 'anonymous';
        img.onload = () => loadImage(img, true);
        setHistory([]);
        setSavedMainCanvas({ imageData: e.target!.result as string, width: img.width, height: img.height })
      };
    }
  }

  function resetAll() {
    if (image) {
      const dynamicImage = document.createElement('img');
      dynamicImage.src = image.imageData;
      dynamicImage.width = image.width!;
      dynamicImage.height = image.height!;
      dynamicImage.onload = function() {
        canvas.current!.getContext('2d')!.clearRect(0, 0, canvas.current!.width, canvas.current!.height);
        canvas.current!.getContext('2d')!.drawImage(dynamicImage, 0, 0);
        setHistory([]);
        setSavedMainCanvas(null);
      }
    }
  }

  function save() {
    const imageData = canvas.current!.toDataURL('image/png');
    setSavedImages([{ uuid: uuidv4(), imageData }, ...savedImages]);
  }

  function downloadSavedImage(imageURL: string) {
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = 'canvas-image.png';

    // Programmatically click the link to trigger the download
    link.click();
  }

  function deleteSavedImage(uuid: string) {
    setSavedImages(savedImages.filter(savedImage => savedImage.uuid != uuid));
  }

  return (
    <>
      <div id='saved-images'>
        <div className='container'>
          <Swiper
            slidesPerView={'auto'}
            spaceBetween={30}
            freeMode={true}
            grabCursor={true}
            navigation={true}
            pagination={{
              clickable: true,
            }}
            modules={[FreeMode, Navigation]}
            className="mySwiper"
          >
            {savedImages.map((image) => <SwiperSlide key={image.uuid}>
              <img src={image.imageData} />
              <Button variant='dark' id='download-saved-image' onClick={() => downloadSavedImage(image.imageData)}>
                <IconDownload stroke={2} />
              </Button>
              <Button variant='dark' id='delete-saved-image' onClick={() => deleteSavedImage(image.uuid!)}>
                <IconTrash stroke={2} />
              </Button>
            </SwiperSlide>)}
          </Swiper>
        </div>
      </div>
      <div id='actions'>
        <input className='d-none' id='select-image' type='file' onChange={upload} />
        <label htmlFor='select-image' className='btn btn-dark'>
          <IconPlus stroke={2} />
          <span>Select image</span>
        </label>
        <Button variant='dark' onClick={toggleEraserMode} id='eraser-button' className={eraser ? 'active' : ''}>
          <IconEraser stroke={2} />
          <span>Eraser</span>
        </Button>
        <Button variant='dark' onClick={toggleBlurMode} id='blur-button' className={blur ? 'active' : ''}>
          <IconBlur stroke={2} />
          <span>Blur</span>
        </Button>
        <Button variant='dark' onClick={save}>
          <IconDeviceFloppy stroke={2} />
          <span>Save</span>
        </Button>
        <Button variant='dark' onClick={undo}>
          <IconArrowBackUp stroke={2} />
          <span>Undo</span>
        </Button>
        <Button variant='dark' onClick={resetAll}>
          <IconRestore stroke={2} />
          <span>Reset all</span>
        </Button>
      </div>
      <div id='canvas-container'>
        <canvas id='canvas' ref={canvas} onMouseMove={handleMouseMoveMainCanvas} onMouseDown={handleMouseDownMainCanvas} onMouseUp={handleMouseUpMainCanvas}></canvas>
        <canvas id='cursor-canvas' className={eraser ? 'inactive' : ''} ref={cursorCanvas} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}></canvas>
      </div>
      <ToastContainer className="position-fixed bottom-0 end-0 p-5">
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} bg={'dark'} autohide>
          <Toast.Header>
            <strong className="me-auto">Info</strong>
          </Toast.Header>
          <Toast.Body className="text-white">Last change reached</Toast.Body>
        </Toast>
      </ToastContainer>
    </>

  );
};

