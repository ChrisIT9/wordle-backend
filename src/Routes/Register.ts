import express, { Request, Response } from 'express';
import User, { UserI } from '../Models/user.model';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import session from '../Connections/session';
import { passwordsMatch, requiresNoAuth } from '../Middlewares/auth';
import { HydratedDocument } from 'mongoose';
import { usernameChecker } from '../Middlewares/validation';
import { validationErrors } from '../Utils/responses';

const registerRouter = express.Router();

registerRouter.use(session);

registerRouter.post(
	'/',
	requiresNoAuth,
	body('username')
		.custom(usernameChecker)
		.withMessage("L'username contiene caratteri non validi!")
		.exists()
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ max: 20 })
		.withMessage("L'username è troppo lungo!"),
	body('password').exists().trim().escape(),
	body('passwordConfirmation')
		.custom(passwordsMatch)
		.withMessage('Le password non corrispondono!'),
	async (
		req: Request<{}, {}, { username: string; password: string }>,
		res: Response
	) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return validationErrors(res, errors);
		const { username, password } = req.body;
		try {
			const user: HydratedDocument<UserI> | null = await User.findOne({
				username,
			});
			if (user)
				return res.status(400).json({ errors: ['Nome utente già esistente!'] });
			const hashPsw: string = await bcrypt.hash(
				password,
				Number(process.env.SALT_ROUNDS)
			);
			const newUser: HydratedDocument<UserI> = new User({
				username,
				password: hashPsw,
			});
			await newUser.save();
			return res.status(201).json({ username, isAdmin: newUser.isAdmin });
		} catch (error: any) {
			return res.status(500).json({ errors: [error] });
		}
	}
);

export default registerRouter;
