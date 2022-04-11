import { Server } from 'socket.io';

const io = new Server(Number(process.env.SOCKET_PORT), {
	pingInterval: Number(process.env.PING_INTERVAL),
	pingTimeout: Number(process.env.PING_TIMEOUT),
	transports: ['websocket']
});

io.on('connection', socket => {
	console.log(`[SOCKET.IO] ${socket.id} connected!`);

	socket.on('disconnect', () => console.log(socket.rooms));
});

export const gamesNamespace = io.of('/games');

export default io;
