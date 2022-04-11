import dotenvConfig from './Config/dotenv_config';
dotenvConfig();
import dbConnection from './Connections/db_connection';
dbConnection();
import express from 'express';
import loginRouter from './Routes/Login';
import registerRouter from './Routes/Register';
import logoutRouter from './Routes/Logout';
import cors from 'cors';
import meRouter from './Routes/Me';
import gamesRouter from './Routes/Games';
import { customAlphabet } from 'nanoid';
import path from 'path';
import fs from 'fs';
import io from './Connections/socket';

io.emit('ciao');

const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const nanoid = customAlphabet(nanoidAlphabet, 21);

export const words = fs.readFileSync(path.join(__dirname + '/../words.txt'), 'utf8').split("\n");

const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth/login', loginRouter);
app.use('/auth/register', registerRouter);
app.use('/auth/logout', logoutRouter);
app.use('/auth/me', meRouter);
app.use('/games', gamesRouter);

const serverPort = process.env.SERVER_PORT;

app.listen(serverPort, () =>
	console.log(`[SERVER] Server online on port ${serverPort}.`)
);
