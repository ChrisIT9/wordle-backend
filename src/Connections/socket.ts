import { Server } from 'socket.io';

const io = new Server(Number(process.env.SOCKET_PORT), {
	pingInterval: Number(process.env.PING_INTERVAL),
	pingTimeout: Number(process.env.PING_TIMEOUT),
});

io.on('connection', socket => {
	console.log(`[SOCKET.IO] ${socket.id} connected!`);
});

export default io;
