import express, { Request, Response } from 'express';
import User, { UserI } from '../Models/user.model';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import session from '../Connections/session';
import { requiresNoAuth } from '../Middlewares/auth';
import { HydratedDocument } from 'mongoose';
import { validationErrors } from '../Utils/responses';

const loginRouter = express.Router();
loginRouter.use(session);

loginRouter.post(
	'/',
	requiresNoAuth,
	body('username').toLowerCase().exists().withMessage('Username non valido!'),
	body('password').exists().trim().escape().withMessage('Password non valida!'),
	async (
		req: Request<{}, {}, { username: string; password: string }>,
		res: Response
	) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return validationErrors(res, errors);
		const { username, password } = req.body;
		try {
			let user: HydratedDocument<UserI> | null = await User.findOne({
				username,
			});
			if (!user)
				return res.status(400).json({ errors: ['Username non trovato!'] });
			let comparePsw = await bcrypt.compare(password, user.password);
			if (!comparePsw)
				return res.status(400).json({ errors: ['Password errata!'] });
			req.session.username = user.username;
			return res
				.status(200)
				.json({ username: user.username, isAdmin: user.isAdmin });
		} catch (error: any) {
			return res.status(500).json({ errors: [error] });
		}
	}
);

export default loginRouter;
