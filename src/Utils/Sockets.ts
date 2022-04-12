import io from '../Connections/socket';
import { GameStatus, Lobby, SocketEvent } from '../Typings/types';
import { HydratedDocument } from 'mongoose';
import Game, { GameI } from '../Models/game.model';

export const generateLobby = (gameId: string): Lobby => {
	const lobby: Lobby = {
		gameId,
		namespace: io.of(`/games/${gameId}`),
		hostSocketId: undefined,
	};
	console.log(`[SOCKET.IO] Created lobby for game ${gameId}.`);
	const connectedUsers: string[] = [];
	lobby.namespace.on('connection', async socket => {
		socket.data = {
			user: socket.handshake.query.user,
			gameId: socket.handshake.query.gameId,
		};
		if (!socket.data.gameId || !socket.data.user) {
			// prettier-ignore
			console.log(`[SOCKET.IO] ${socket.data.user || socket.id} connected but did not correctly identify itself. Disconnecting.`);
			socket.disconnect();
			return;
		}
		const gameAtConnection: HydratedDocument<GameI> | null = await Game.findOne(
			{
				gameId: socket.data.gameId,
			}
		);
		if (!gameAtConnection) {
			// prettier-ignore
			console.log(`[SOCKET.IO] ${socket.data.user || socket.id} provided an invalid gameId (${socket.data.gameId}). Disconnecting.`);
			socket.disconnect();
			return;
		}
		if (!gameAtConnection.players.includes(socket.data.user)) {
			console.log(
				`[SOCKET.IO] ${
					socket.data.user || socket.id
				} connected to ${gameId} but is not a player of the game. Disconnecting.`
			);
			socket.disconnect();
			return;
		}
		const isHost = socket.data.user === gameAtConnection.host;
		if (!connectedUsers.includes(socket.data.user)) {
      console.log(
        `[SOCKET.IO] ${socket.data.user || socket.id} ${
          isHost ? '(HOST)' : ''
        } connected to ${gameId}.`
      );
      connectedUsers.push(socket.data.user);
    }
		else {
			console.log(
				`[SOCKET.IO] ${
					socket.data.user || socket.id
				} connected but a socket for the user already exists. Disconnecting.`
			);
      socket.emit(SocketEvent.SOCKET_CONFLICT);
			socket.disconnect();
			return;
		}
		lobby.namespace.emit(SocketEvent.PLAYER_CONNECTED, socket.data.user);
		socket.data = {
			...socket.data,
			isHost,
		};
		socket.on('disconnect', async () => {
			if (!socket.data.gameId || !socket.data.user || !gameAtConnection) return;
			const gameAtDisconnection: HydratedDocument<GameI> | null =
				await Game.findOne({
					gameId: socket.data.gameId,
				});
			// prettier-ignore
			const playerIndex = connectedUsers.findIndex(connectedUser => connectedUser === socket.data.user);
			playerIndex !== -1 && connectedUsers.splice(playerIndex, 1);
			if (
				gameAtDisconnection &&
				gameAtDisconnection.gameStatus === GameStatus.HAS_TO_START
			) {
				if (socket.data.isHost) {
					console.log(
						`[SOCKET.IO] Host disconnected from the lobby ${gameId}. Disbanding game...`
					);
					await gameAtDisconnection.delete();
					lobby.namespace.emit(SocketEvent.HOST_DISCONNECTED, socket.data.user);
				} else {
					console.log(
						`[SOCKET.IO] ${
							socket.data.user || socket.id
						} disconnected from ${gameId}.`
					);
					const playerIndex = gameAtDisconnection.players.findIndex(
						player => player === socket.data.user
					);
					playerIndex !== -1 &&
						gameAtDisconnection.players.splice(playerIndex, 1);
					await gameAtDisconnection.save();
					lobby.namespace.emit(
						SocketEvent.PLAYER_DISCONNECTED,
						socket.data.user
					);
				}
			}
		});
	});
	return lobby;
};
