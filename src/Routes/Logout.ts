import express, { Request, Response } from 'express';
import session from '../Connections/session';
import { requiresAuth } from '../Middlewares/auth';

const logoutRouter = express.Router();

logoutRouter.use(session);

logoutRouter.post('/', requiresAuth, (req: Request, res: Response) => {
	if (!req.session.username)
		return res
			.status(400)
			.json({ errors: ['Nessuna sessione da disconnettere'] });
	req.session.destroy(err => {
		if (err)
			return res
				.status(500)
				.json({ errors: ['Impossibile distruggere la sessione!'] });
	});
	return res.status(200).json({ message: 'Disconnesso.' });
});

export default logoutRouter;
