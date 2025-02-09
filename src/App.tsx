import './App.css'
import { Header } from './layouts/Header/Header';
import { Home } from './pages/Home/Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'swiper/css';
import 'swiper/css/navigation';

function App() {
  return (
    <>
      <Header></Header>
      <Home></Home>
    </>
  );
}

export default App

