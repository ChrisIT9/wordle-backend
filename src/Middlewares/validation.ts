import { CustomValidator } from 'express-validator';

export const usernameChecker: CustomValidator = (username: string) => {
	if (username.includes('/')) throw 'Carattere non permesso!';

	return true;
};
