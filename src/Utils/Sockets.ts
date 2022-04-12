import io from '../Connections/socket';
import { GameStatus, Lobby } from '../Typings/types';
import { HydratedDocument } from 'mongoose';
import Game, { GameI } from '../Models/game.model';

export const generateLobby = (gameId: string): Lobby => {
	const lobby: Lobby = {
		gameId,
		namespace: io.of(`/games/${gameId}`),
		hostSocketId: undefined,
	};
  console.log(`[SOCKET.IO] Created lobby for game ${gameId}.`);
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
			console.log(`[SOCKET.IO] ${socket.data.user || socket.id} provided an invalid gameId. Disconnecting.`);
			socket.disconnect();
			return;
		}
    if (!gameAtConnection.players.includes(socket.data.user)) {
      console.log(`[SOCKET.IO] ${socket.data.user || socket.id} connected to ${gameId} but is not a player of the game. Disconnecting.`);
      socket.disconnect();
      return;
    }
    console.log(`[SOCKET.IO] ${socket.data.user || socket.id} connected to ${gameId}.`);
    lobby.namespace.emit('PLAYER_CONNECTED', socket.data.user);
		socket.data = {
			...socket.data,
			isHost: socket.data.user === gameAtConnection.host,
		};
		socket.on('disconnect', async () => {
			if (!socket.data.gameId || !socket.data.user || !gameAtConnection) return;
			const gameAtDisconnection: HydratedDocument<GameI> | null =
				await Game.findOne({
					gameId: socket.data.gameId,
				});
			// prettier-ignore
			if (gameAtDisconnection && gameAtDisconnection.gameStatus === GameStatus.HAS_TO_START) {
        if (socket.data.isHost) {
          console.log(`[SOCKET.IO] Host disconnected from the lobby ${gameId}. Disbanding game...`);
          lobby.namespace.emit('HOST_DISCONNECTED', socket.data.user);
          await gameAtDisconnection.delete();
        } else {
          console.log(`[SOCKET.IO] ${socket.data.user || socket.id} disconnected from ${gameId}.`);
          const playerIndex = gameAtDisconnection.players.findIndex(player => player === socket.data.user);
          playerIndex !== -1 && gameAtDisconnection.players.splice(playerIndex, 1);
          lobby.namespace.emit('PLAYER_DISCONNECTED', socket.data.user);
          await gameAtDisconnection.save();
        }
      }
		});
	});
	return lobby;
};
