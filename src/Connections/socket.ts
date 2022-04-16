import { Server } from 'socket.io';

const io = new Server(Number(process.env.PORT), {
	pingInterval: Number(process.env.PING_INTERVAL),
	pingTimeout: Number(process.env.PING_TIMEOUT),
	transports: ['websocket']
});

export default io;
