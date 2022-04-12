import Game, { GameI } from '../Models/game.model';
import { HydratedDocument } from 'mongoose';
import { GameStatus } from '../Typings/types';

export const closeAllGames = async () => {
	const games: HydratedDocument<GameI>[] = await Game.find({
		$or: [
			{ gameStatus: GameStatus.HAS_TO_START },
			{ gameStatus: GameStatus.IN_PROGRESS },
		],
	});
  for await (const game of games) {
    game.gameStatus = GameStatus.TIED;
    await game.save();
  }
};
