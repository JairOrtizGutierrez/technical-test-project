import { useState } from 'react';

export const useLocalStorage = <T>(key: string, value: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : value;
    } catch (error) {
      return value;
    }
  });

  const setValue = (newValue: T): void => {
    try {
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

