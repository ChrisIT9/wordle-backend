import mongoose from 'mongoose';
import { GameStatus } from '../Typings/types';

const GameSchema = new mongoose.Schema({
	gameId: {
		type: String,
		required: true,
	},
	players: {
		type: [String],
		default: [],
	},
	gameStatus: {
		type: String,
		default: GameStatus.HAS_TO_START,
	},
	winner: {
		type: String,
		default: undefined,
	},
	word: {
		type: String,
		required: true,
	},
	moves: {
		type: [String], // playerName/word
		default: [],
	},
	host: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now
	}
});

export interface GameI {
	gameId: string;
	players: string[];
	gameStatus: GameStatus;
	winner: string | undefined;
	word: string;
	moves: string[];
	host: string;
	date: string | undefined;
}

const Game = mongoose.model('Game', GameSchema);

export default Game;
