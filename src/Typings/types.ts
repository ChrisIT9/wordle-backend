import { Namespace } from "socket.io";

export enum GameStatus {
	HAS_TO_START = 'HAS TO START',
	IN_PROGRESS = 'IN PROGRESS',
	WON = 'WON',
	TIED = 'TIED',
}

export enum LetterPosition {
	MISSING = 'WRONG',
	RIGHT = 'RIGHT',
	WRONG_POSITION = 'WRONG POSITION',
}

export interface MappedWord {
	[key: string]: {
		indexes: number[];
		left: number;
	};
}

export interface Lobby {
  hostSocketId: string | undefined,
  namespace: Namespace,
  gameId: string
}
