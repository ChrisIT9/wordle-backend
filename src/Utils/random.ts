import { words } from '../app';

export const getRandomNumber = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

export const getRandomWord = () => {
  const randomIndex = getRandomNumber(0, words.length - 1);
  return words[randomIndex];
};