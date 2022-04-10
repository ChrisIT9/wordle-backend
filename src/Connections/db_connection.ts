import mongoose from 'mongoose';

const dbInit = () => {
	const dbUrl = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
	mongoose.connect(dbUrl, error => error && console.log(error));
	const db = mongoose.connection;
	db.once('open', () => console.log(`[DATABASE] Connected to ${dbUrl}.`));
};

export default dbInit;
