import mongoose from "mongoose";
const connectDb = async () => {
  const url = process.env.MONGODB_URI;
  if (!url) {
    throw new Error("MONGO_URI IS NOT DEFINED IN ENVIORNMENT VARIABLES");
  }
  try {
    await mongoose.connect(url, {
      dbName: "ChatappWithMicroservices",
    });
    console.log("Connected to MongoDb");
  } catch (error) {
    console.error("Failed to connect to MongoDb", error);
    process.exit(1);
  }
};

export default connectDb;