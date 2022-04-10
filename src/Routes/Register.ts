import express, { Request, Response } from 'express';
import User from '../Models/user.model';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import session from '../Connections/session';
import { passwordsMatch, requiresNoAuth } from '../Middlewares/auth';

const registerRouter = express.Router();

registerRouter.use(session);

registerRouter.post(
	'/',
	requiresNoAuth,
	body('username')
		.exists()
		.trim()
		.escape()
		.withMessage(
			`Il nome utente deve contenere almeno ${process.env.MIN_USERNAME_LEN} caratteri!`
		),
	body('password')
		.exists()
		.trim()
		.escape()
		.withMessage(
			`La password deve contenere almeno ${process.env.MIN_PASS_LEN} caratteri!`
		),
	body('passwordConfirmation')
		.custom(passwordsMatch)
		.withMessage('Le password non corrispondono!'),
	async (
		req: Request<{}, {}, { username: string; password: string }>,
		res: Response
	) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res
				.status(400)
				.json({ errors: errors.array().map(item => item.msg) });

		const { username, password } = req.body;

		try {
			const user = await User.findOne({
				username,
			});
			if (user)
				return res.status(400).json({ errors: ['Nome utente già esistente!'] });
			const hashPsw: string = await bcrypt.hash(
				password,
				Number(process.env.SALT_ROUNDS)
			);
			const newUser = new User({
				username,
				password: hashPsw,
			});
			await newUser.save();
			return res.status(201).json({ username });
		} catch (error: any) {
			return res.status(500).json({ errors: [error] });
		}
	}
);

export default registerRouter;
