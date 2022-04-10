import express, { Request, Response } from 'express';
import User from '../Models/user.model';
import session from '../Connections/session';
import { requiresAuth } from '../Middlewares/auth';

const meRouter = express.Router();

meRouter.use(session);

meRouter.get('/', requiresAuth, async (req: Request, res: Response) => {
	const username = req.session.username;
	const user = await User.findOne({ username });
	return user
		? res.status(200).json(user)
		: res.status(401).json({ errors: ['Utente non trovato!'] });
});

export default meRouter;
