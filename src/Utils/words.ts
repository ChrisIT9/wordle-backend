import { Board, LetterPosition, MappedWord } from '../Typings/types';

export const getMappedWord = (word: string): MappedWord => {
	return word.split('').reduce((acc, letter, index) => {
		return {
			...acc,
			[letter]: {
				indexes:
					acc[letter] && acc[letter].indexes
						? [...acc[letter].indexes, index]
						: [index],
				left:
					acc[letter] && acc[letter].left != null ? acc[letter].left + 1 : 1,
			},
		};
	}, {} as Record<string, { indexes: number[]; left: number }>);
};

export const getBoard = (
	mappedWord: MappedWord,
	providedWord: string
): LetterPosition[] => {
	let board: LetterPosition[] = [];
	const uncertainLetters = providedWord.split('').map((letter, index) => {
		if (!mappedWord[letter]) {
			board[index] = LetterPosition.MISSING;
			return;
		}
		if (
			mappedWord[letter].indexes.includes(index) &&
			mappedWord[letter].left > 0
		) {
			mappedWord[letter].left -= 1;
			board[index] = LetterPosition.RIGHT;
			return;
		}
		return { letter, index };
	});
	uncertainLetters.map(uncertainLetter => {
		if (uncertainLetter) {
			const { letter, index } = uncertainLetter;
			mappedWord[letter].left > 0
				? (board[index] = LetterPosition.WRONG_POSITION) && (mappedWord[letter].left -= 1)
				: (board[index] = LetterPosition.MISSING);
		}
	});
	return board;
};

export const generateEmptyBoard = (): Board => {
	const board: Board = {};
	const defaultLetterPositions: LetterPosition[] = [];
	for (let x = 0; x < 5; x++) defaultLetterPositions[x] = LetterPosition.EMPTY;
	for (let i = 0; i < 6; i++) {
		board[i] = {
			word: undefined,
			letterPositions: defaultLetterPositions,
		};
	}
	return board;
};
