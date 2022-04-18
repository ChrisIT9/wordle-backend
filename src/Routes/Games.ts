import express, { Request } from 'express';
import session from '../Connections/session';
import { body, validationResult } from 'express-validator';
import { requiresAuth } from '../Middlewares/auth';
import Game, { GameI } from '../Models/game.model';
import { getRandomWord } from '../Utils/random';
import { nanoid, words } from '../app';
import {
	GameStatus,
	LetterPosition,
	Lobby,
	Move,
	SocketEvent,
} from '../Typings/types';
import { HydratedDocument } from 'mongoose';
import { getBoard, getMappedWord } from '../Utils/words';
import {
	alreadyAPlayerError,
	gameAlreadyOverError,
	gameFullError,
	gameNotFoundError,
	gameNotReadyError,
	invalidWordError,
	missingPlayersError,
	notAPlayerError,
	notGameHostError,
	outOfMovesError,
	validationErrors,
} from '../Utils/responses';
import { destroyLobby, generateLobby } from '../Utils/Sockets';
import bcrypt from 'bcrypt';

export const lobbies: Lobby[] = [];
let moves: Move[] = [];

const gamesRouter = express.Router();
gamesRouter.use(session);

// Get all games who haven't started yet
gamesRouter.get('/', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return validationErrors(res, errors);
	try {
		const games: HydratedDocument<GameI>[] = await Game.find(
			{
				$and: [
					{ gameStatus: GameStatus.HAS_TO_START },
					{ players: { $ne: req.session.username } },
				],
			},
			'-word'
		);
		return res
			.status(200)
			.json(games.filter(({ players }) => players.length < 2));
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

// Join a game lobby of which you're one of the players
gamesRouter.get('/:gameId/lobby', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return validationErrors(res, errors);
	try {
		const { gameId } = req.params;
		const game: HydratedDocument<GameI> | null = await Game.findOne(
			{ gameId },
			'-word'
		);
		if (!game) return gameNotFoundError(res);
		if (!game.players.includes(req.session.username!))
			return notAPlayerError(res);
		if (
			game.gameStatus === GameStatus.TIED ||
			game.gameStatus === GameStatus.WON
		)
			return gameAlreadyOverError(res);
		return res
			.status(200)
			.json({ game, isHost: game.host === req.session.username });
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

// Join a game in progress of which you're one of the players
gamesRouter.get('/:gameId', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return validationErrors(res, errors);
	try {
		const { gameId } = req.params;
		const game: HydratedDocument<GameI> | null = await Game.findOne(
			{ gameId },
			'-word'
		);
		if (!game) return gameNotFoundError(res);
		if (!game.players.includes(req.session.username!))
			return notAPlayerError(res);
		if (
			game.gameStatus === GameStatus.TIED ||
			game.gameStatus === GameStatus.WON
		)
			return gameAlreadyOverError(res);
		return res.status(200).json(game);
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

// Joining a game as a player
gamesRouter.patch(
	'/:gameId/players',
	async (
		req: Request<{ gameId: string }, {}, { password: string | undefined }>,
		res
	) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return validationErrors(res, errors);
		try {
			const { gameId } = req.params;
			const { password } = req.body;
			const game: HydratedDocument<GameI> | null = await Game.findOne(
				{
					gameId,
				},
				'-word'
			);
			if (!game) return gameNotFoundError(res);
			if (game.players.includes(req.session.username!))
				return alreadyAPlayerError(res);
			if (game.players.length === 2) return gameFullError(res);
			game.players.push(req.session.username!);
			if (game.password) {
				if (!password)
					return res.status(403).json({ message: 'Fornire una password!' });
				const passwordsMatch = await bcrypt.compare(password, game.password);
				if (!passwordsMatch)
					return res
						.status(400)
						.json({ message: 'La password non corrisponde!' });
			}
			await game.save();
			return res
				.status(200)
				.json({ message: 'Ti sei unito alla partita!', game });
		} catch (error) {
			return res.status(500).json({ errors: [error] });
		}
	}
);

// Start a game
gamesRouter.put('/:gameId/status', async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return validationErrors(res, errors);
	try {
		const { gameId } = req.params;
		const game: HydratedDocument<GameI> | null = await Game.findOne(
			{ gameId },
			'-word'
		);
		if (!game) return gameNotFoundError(res);
		if (game.host !== req.session.username) return notGameHostError(res);
		if (game.players.length < 2) return missingPlayersError(res);
		game.gameStatus = GameStatus.IN_PROGRESS;
		await game.save();
		const lobby = lobbies.find(lobby => lobby.gameId === gameId);
		lobby && lobby.namespace.emit(SocketEvent.GAME_STARTED);
		return res.status(200).json({ message: 'Partita iniziata!', game });
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

// Make a move
gamesRouter.patch(
	'/:gameId/moves',
	requiresAuth,
	body('word')
		.exists()
		.withMessage('Fornire una parola!')
		.isString()
		.withMessage('Formato non valido!')
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ min: 5, max: 5 })
		.withMessage('Lunghezza parola non valida!'),
	async (req: Request<{ gameId: string }, {}, { word: string }>, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return validationErrors(res, errors);
		try {
			const { gameId } = req.params;
			const { word: providedWord } = req.body;
			const game: HydratedDocument<GameI> | null = await Game.findOne({
				gameId,
			});
			if (!game) return gameNotFoundError(res);
			if (!game.players.includes(req.session.username!))
				return notAPlayerError(res);
			if (game.gameStatus !== GameStatus.IN_PROGRESS)
				return gameNotReadyError(res);
			if (!words.includes(providedWord)) return invalidWordError(res);
			// prettier-ignore
			const userMoves = game.moves.filter(move => {
				const [username] = move.split('/');
				return username === req.session.username;
			});
			if (userMoves.length >= 6) return outOfMovesError(res);
			const previousMoveIndex = moves.findIndex(
				move => game.gameId === gameId && move.user === req.session.username
			);
			if (previousMoveIndex !== -1) {
				if (Date.now() - moves[previousMoveIndex].when < 500)
					return res
						.status(429)
						.json({ message: 'Rilevato doppio invio. Ignoro.' });
				else
					moves[previousMoveIndex] = {
						user: req.session.username!,
						gameId,
						when: Date.now(),
					};
			} else
				moves.push({ user: req.session.username!, gameId, when: Date.now() });
			const lobby = lobbies.find(lobby => lobby.gameId === gameId);
			const wordToFind = game.word;
			game.moves.push(`${req.session.username}/${providedWord}`);
			const board = getBoard(getMappedWord(wordToFind), providedWord);
			lobby &&
				lobby.namespace.emit(SocketEvent.GAME_MOVES, {
					user: req.session.username,
					board,
				});
			if (wordToFind === providedWord) {
				game.gameStatus = GameStatus.WON;
				game.winner = req.session.username!;
				lobby &&
					lobby.namespace.emit(SocketEvent.GAME_ENDED, {
						result: 'WON',
						winner: req.session.username,
						word: game.word,
					}) &&
					destroyLobby(lobby);
				moves = moves.filter(move => move.gameId !== gameId);
			} else if (game.moves.length === 12) {
				game.gameStatus = GameStatus.TIED;
				lobby &&
					lobby.namespace.emit(SocketEvent.GAME_ENDED, {
						result: 'TIED',
						word: game.word,
					}) &&
					destroyLobby(lobby);
				moves = moves.filter(move => move.gameId !== gameId);
			}
			await game.save();
			return res.status(200).json({
				board,
				hasWon: board.every(letter => letter === LetterPosition.RIGHT),
			});
		} catch (error) {
			return res.status(500).json({ errors: [error] });
		}
	}
);

// Create a game
gamesRouter.post(
	'/',
	requiresAuth,
	async (req: Request<{}, {}, { password: string | undefined }>, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return validationErrors(res, errors);
		try {
			const { password } = req.body;
			const word = getRandomWord();
			const gameId = nanoid();
			const newGame: HydratedDocument<GameI> = new Game({
				gameId,
				word,
				host: req.session.username!,
				players: [req.session.username],
				password: password
					? await bcrypt.hash(password, Number(process.env.SALT_ROUNDS))
					: undefined,
			});
			await newGame.save();
			const lobby: Lobby = generateLobby(gameId);
			lobbies.push(lobby);
			return res.status(201).json({
				message: 'Partita creata con successo!',
				game: {
					gameId: newGame.gameId,
					date: newGame.date,
					host: newGame.host,
					players: newGame.players,
				},
			});
		} catch (error) {
			return res.status(500).json({ errors: [error] });
		}
	}
);

export default gamesRouter;
