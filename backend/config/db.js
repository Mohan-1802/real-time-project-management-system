import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUri = (process.env.MONGODB_URI || "").replace(/;$/, "");

        if (!mongoUri) {
            throw new Error("MONGODB_URI is not defined");
        }

        const connection = await mongoose.connect(mongoUri);
        console.log(`MongoDB connected ${connection.connection.host}`);
    } catch (error) {
        console.log(`DB connection error :${error.message}`);
        process.exit(1);
    }
};

export default connectDB;

