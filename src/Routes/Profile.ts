import express from 'express';
import session from '../Connections/session';
import { validationResult } from 'express-validator';
import { requiresAuth } from '../Middlewares/auth';
import User, { UserI } from '../Models/user.model';
import { validationErrors } from '../Utils/responses';
import { HydratedDocument } from 'mongoose';
import Game, { GameI } from '../Models/game.model';
import { GameStatus } from '../Typings/types';
import { generateEmptyBoard, getBoard, getMappedWord } from '../Utils/words';

const usersRouter = express.Router();
usersRouter.use(session);

usersRouter.get('/me/history', requiresAuth, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return validationErrors(res, errors);
	try {
		const user: HydratedDocument<UserI> | null = await User.findOne({
			username: req.session.username,
		});
		if (user) {
			const playedGames: HydratedDocument<GameI>[] = await Game.find({
				$and: [
					{ players: user.username },
					{
						$or: [
							{ gameStatus: GameStatus.TIED },
							{ gameStatus: GameStatus.WON },
						],
					},
				],
			}).sort({ date: -1 });
			const validGames = playedGames.filter(
				({ moves, gameStatus }) =>
					(moves.length > 0 && gameStatus === GameStatus.WON) ||
					(moves.length === 12 && gameStatus === GameStatus.TIED)
			);
			const mappedGames = validGames.map(game => {
				const playerGuesses = game.moves.filter(move => {
					const [player] = move.split('/');
					return player === user.username;
				});
				const opponentGuesses = game.moves.filter(move => {
					const [player] = move.split('/');
					return player !== user.username;
				});
				const opponentBoard = opponentGuesses.reduce(
					(acc, opponentGuess, index) => {
						const [, word] = opponentGuess.split('/');
						return {
							...acc,
							[index]: {
								word: word.toUpperCase(),
								letterPositions: getBoard(getMappedWord(game.word), word),
							},
						};
					},
					generateEmptyBoard()
				);
				const playerBoard = playerGuesses.reduce((acc, playerGuess, index) => {
					const [, word] = playerGuess.split('/');
					return {
						...acc,
						[index]: {
							word: word.toUpperCase(),
							letterPositions: getBoard(getMappedWord(game.word), word),
						},
					};
				}, generateEmptyBoard());
				return {
					// prettier-ignore
					gameId: game.gameId,
					opponent: game.players.find(player => player !== user.username),
					gameResult: game.winner
						? game.winner === user.username
							? 'WON'
							: 'LOST'
						: 'TIED',
					wordToFind: game.word,
					playerGuesses: playerBoard,
					opponentGuesses: opponentBoard,
          date: game.date
				};
			});
			const gamesWon = validGames.reduce(
				(acc, { winner }) => (winner === user.username ? acc + 1 : acc),
				0
			);
			return res
				.status(200)
				.json({ games: mappedGames, gamesWon, gamesPlayed: validGames.length });
		}
		return res.status(404).json({ message: 'Utente non trovato!' });
	} catch (error) {
		return res.status(500).json({ errors: [error] });
	}
});

export default usersRouter;
