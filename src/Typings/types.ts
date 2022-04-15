import { Namespace } from 'socket.io';

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
	EMPTY = 'EMPTY'
}

export enum SocketEvent {
	PLAYER_CONNECTED = 'PLAYER_CONNECTED',
	PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
	HOST_DISCONNECTED = 'HOST_DISCONNECTED',
	GAME_STARTED = 'GAME_STARTED',
	GAME_ENDED = 'GAME_ENDED',
	GAME_MOVES = 'GAME_MOVES',
	SOCKET_CONFLICT = 'SOCKET_CONFLICT'
}

export interface MappedWord {
	[key: string]: {
		indexes: number[];
		left: number;
	};
}

export interface Board {
	[key: number]: {
		word: string | undefined,
		letterPositions: LetterPosition[]
	}
}

export interface Lobby {
	hostSocketId: string | undefined;
	namespace: Namespace;
	gameId: string;
}

export interface SocketInfo {
	user: string;
	gameId: string;
	isHost: boolean
}
