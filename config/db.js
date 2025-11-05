import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please set MONGODB_URI in your .env file or deployment environment.');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Note: remove useNewUrlParser and useUnifiedTopology in newer versions
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

