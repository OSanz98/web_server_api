import mongoose from 'mongoose';

/**
 * Connect Express server to MongoDB instance, using variables set in environment
 */
export default function connectDB() {
    try {
        const url = process.env.MONGODB_URL.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
        mongoose.connect(url).then(() => {
            console.log('connected to db')
        });
    }catch(err) {
        console.error(err.message);
        process.exit(1);
    }
}
