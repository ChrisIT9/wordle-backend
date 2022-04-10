import expS from 'express-session';

declare module 'express-session' {
	export interface SessionData {
		username: string;
	}
}

const session = expS({
	secret: process.env.SESSION_SECRET!,
	saveUninitialized: true,
	resave: false,
});

export default session;
