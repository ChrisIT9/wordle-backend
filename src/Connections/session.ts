import expS from 'express-session';
import MongoStore from 'connect-mongo';
import { dbUrl } from './db_connection';

declare module 'express-session' {
	export interface SessionData {
		username: string;
	}
}

const session = expS({
	secret: process.env.SESSION_SECRET!,
	saveUninitialized: true,
	resave: false,
	cookie: {
		sameSite: 'none',
		secure: true,
		httpOnly: false,
		maxAge: 1000 * 14 * 24 * 60 * 60,
	},
	store: MongoStore.create({
		mongoUrl: dbUrl,
		collectionName: 'sessions',
		touchAfter: 24 * 3600,
	}),
});

export default session;
