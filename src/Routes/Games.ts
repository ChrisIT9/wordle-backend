import express, { Request } from 'express';
import session from '../Connections/session';
import { body, validationResult } from 'express-validator';
import { requiresAuth } from '../Middlewares/auth';
import Game, { GameI } from '../Models/game.model';
import { getRandomWord } from '../Utils/random';
import { nanoid, words } from '../app';
import { GameStatus } from '../Typings/types';
import { HydratedDocument } from 'mongoose';

const gamesRouter = express.Router();
gamesRouter.use(session);

// Get all games who haven't started yet
gamesRouter.get('/', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const games: HydratedDocument<GameI>[] = await Game.find({
			gameStatus: GameStatus.HAS_TO_START,
		});
		return res.status(200).json(games);
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

// Join a game lobby of which you're one of the players
gamesRouter.get('/:gameId', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const { gameId } = req.params;
		const game: HydratedDocument<GameI> | null = await Game.findOne({ gameId });
		if (!game)
			return res
				.status(404)
				.json({ message: 'Nessuna partita esistente con questo id!' });
		if (!game.players.includes(req.session.username!))
			return res
				.status(400)
				.json({ message: 'Non sei un giocatore di questa partita!' });
		return res.status(200).json(game);
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

// Joining a game
gamesRouter.patch('/:gameId', async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const { gameId } = req.params;
		const game: HydratedDocument<GameI> | null = await Game.findOne({ gameId });
		if (!game)
			return res
				.status(404)
				.json({ message: 'Nessuna partita esistente con questo id!' });
		if (game.players.includes(req.session.username!))
			return res.status(409).json({ message: 'Sei già in questa partita!' });
		if (game.players.length === 2)
			return res.status(400).json({ message: 'Partita al completo!' });
		game.players.push(req.session.username!);
		await game.save();
		return res
			.status(200)
			.json({ message: 'Ti sei unito alla partita!', game });
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

// Start a game
gamesRouter.patch('/:gameId/status', async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const { gameId } = req.params;
		const game: HydratedDocument<GameI> | null = await Game.findOne({ gameId });
		if (!game)
			return res
				.status(404)
				.json({ message: 'Nessuna partita esistente con questo id!' });
		if (game.host !== req.session.username)
			return res
				.status(403)
				.json({ message: 'Non sei il proprietario di questa partita!' });
		if (game.players.length < 2)
			return res
				.status(400)
				.json({ message: 'Numero di giocatori insufficente!' });
		game.gameStatus = GameStatus.IN_PROGRESS;
		await game.save();
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
		.isLength({ min: 5, max: 5 })
		.withMessage('Lunghezza parola non valida!'),
	async (req: Request<{ gameId: string }, {}, { word: string }>, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res
				.status(400)
				.json({ errors: errors.array().map(item => item.msg) });
		try {
			const { gameId } = req.params;
			const { word: providedWord } = req.body;
			const game: HydratedDocument<GameI> | null = await Game.findOne({
				gameId,
			});
			if (!game)
				return res
					.status(404)
					.json({ message: 'Nessuna partita esistente con questo id!' });
			if (!game.players.includes(req.session.username!))
				return res
					.status(400)
					.json({ message: 'Non sei un giocatore di questa partita!' });
			if (!words.includes(providedWord))
				return res.status(400).json({ message: 'Parola non valida!' });
			if (
				game.moves.filter(move => move.includes(req.session.username!))
					.length >= 6
			)
				return res.status(409).json({ message: 'Hai esaurito le mosse!' });
			const wordToFind = game.word;
			game.moves.push(`${req.session.username}/${providedWord}`);
			if (wordToFind === providedWord) {
				game.gameStatus = GameStatus.WON;
				game.winner = req.session.username!;
			}
			await game.save();
			return res.status(200).json({ message: 'OK', game });
		} catch (error) {
			return res.status(500).json({ errors: [error] });
		}
	}
);

// Create a game
gamesRouter.post('/', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const word = getRandomWord();
		const gameId = nanoid();
		const newGame: HydratedDocument<GameI> = new Game({
			gameId,
			word,
			host: req.session.username!,
		});
		await newGame.save();
		return res.status(200).json({
			message: 'Partita creata con successo!',
			game: newGame,
		});
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

export default gamesRouter;
