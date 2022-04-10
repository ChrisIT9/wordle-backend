import express from 'express';
import session from '../Connections/session';
import { validationResult } from 'express-validator';
import { requiresAuth } from '../Middlewares/auth';
import Game, { GameInterface } from '../Models/game.model';
import { getRandomWord } from '../Utils/getRandomWord';
import { nanoid } from '../app';
import { GameStatus } from '../Typings/types';

const gamesRouter = express.Router();
gamesRouter.use(session);

gamesRouter.get('/', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const games: GameInterface[] = await Game.find({
			gameStatus: GameStatus.HAS_TO_START,
		});
		return res.status(200).json(games);
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

gamesRouter.get('/:gameId', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const { gameId } = req.params;
		const game: GameInterface | null = await Game.findOne({ gameId });
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

gamesRouter.patch('/:gameId', async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const { gameId } = req.params;
		const game = await Game.findOne({ gameId });
		if (!game)
			return res
				.status(404)
				.json({ message: 'Nessuna partita esistente con questo id!' });
		if (game.players.includes(req.session.username))
			return res.status(409).json({ message: 'Sei già in questa partita!' });
		if (game.players.length === 2)
			return res.status(400).json({ message: 'Partita al completo!' });
		game.players.push(req.session.username);
		await game.save();
		return res
			.status(200)
			.json({ message: 'Ti sei unito alla partita!', game });
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

gamesRouter.post('/', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res
			.status(400)
			.json({ errors: errors.array().map(item => item.msg) });
	try {
		const word = await getRandomWord();
		const gameId = nanoid();
		const { username } = req.session;
		const newGame = new Game({
			gameId,
			word,
			players: [username],
		});
		await newGame.save();
		return res.status(200).json({
			message: 'Partita creata con successo!',
			id: gameId,
			word,
		});
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

export default gamesRouter;
