import fs from 'fs';
import path from 'path';
import { getRandomNumber } from './randomNumber';

export const getRandomWord = async () => {
  const words = fs.readFileSync(path.join(__dirname + '../../../words.txt'), 'utf8').split("\n");

  const randomIndex = getRandomNumber(0, words.length - 1);

  return words[randomIndex];
};