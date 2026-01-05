import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async (): Promise<boolean> => {
    try {
        await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log('MongoDB Connected');
        return true;
    } catch (err) {
        console.error('MongoDB Connection Failed:', (err as Error).message);
        return false;
    }
};
