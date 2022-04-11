import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
});

export interface UserI {
	username: string;
	password: string;
	isAdmin: boolean;
}

const User = mongoose.model('User', UserSchema);

export default User;
