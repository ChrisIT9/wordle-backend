import mongoose from 'mongoose';
export const dbUrl =
	process.env.DB_URI ||
	`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const dbInit = () => {
	mongoose.connect(dbUrl, error => error && console.log(error));
	const db = mongoose.connection;
	db.once('open', () => console.log(`[DATABASE] Connected to ${dbUrl}.`));
};

export default dbInit;
