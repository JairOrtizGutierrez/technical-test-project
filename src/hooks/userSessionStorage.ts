import { useState } from 'react';

export const useSessionStorage = <T>(key: string, value: T): [T, (value: T) => void] => {
  const [sessionValue, setSessionValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : value;
    } catch (error) {
      return value;
    }
  });

  const setValue = (newValue: T): void => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(newValue));
      setSessionValue(newValue);
    } catch (error) {
      console.log(error);
    }
  };

  return [sessionValue, setValue];
};

