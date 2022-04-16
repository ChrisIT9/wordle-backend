import { Result, ValidationError } from 'express-validator';
import { Response } from 'express';

export const validationErrors = (
	res: Response,
	errors: Result<ValidationError>
) => {
	return res.status(400).json({ errors: errors.array().map(item => item.msg) });
};

export const gameNotFoundError = (res: Response) => {
	return res
		.status(404)
		.json({ message: 'Nessuna partita esistente con questo ID!' });
};

export const notAPlayerError = (res: Response) => {
	return res
		.status(403)
		.json({ message: 'Non sei un giocatore di questa partita!' });
};

export const alreadyAPlayerError = (res: Response) => {
	return res.status(409).json({ message: 'Sei già in questa partita!' });
};

export const gameFullError = (res: Response) => {
	return res.status(400).json({ message: 'Partita al completo!' });
};

export const missingPlayersError = (res: Response) => {
	return res.status(400).json({ message: 'Numero di giocatori insufficente!' });
};

export const gameNotReadyError = (res: Response) => {
	return res.status(400).json({
		message: 'La partita non è ancora iniziata o è già finita!',
	});
};

export const notGameHostError = (res: Response) => {
	return res
		.status(403)
		.json({ message: 'Non sei il proprietario di questa partita!' });
};

export const gameAlreadyOverError = (res: Response) => {
	return res.status(400).json({
		message: 'La partita è già finita!',
	});
};

export const invalidWordError = (res: Response) => {
  return res.status(400).json({ message: 'Parola non valida!' });
};

export const outOfMovesError = (res: Response) => {
  return res.status(409).json({ message: 'Hai esaurito le mosse!' });
};
