import { connectionToRabbitMq } from "./config/rabbitmq.js";
import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
dotenv.config();
connectDb();
connectionToRabbitMq();
export const redisClient = createClient({
  url: process.env.REDIS_URL!,
});

await redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);

const app = express();
app.use(express.json()); // to use data send by anyone in the body in our route handler
app.use(express.urlencoded({ extended: true })); // to read the form data as json object
app.use(cors()); //allow request from other different origin ,why need ? bcz By default, browsers block requests from different domains/ports (for security).
app.use("/api/v1", userRoutes);
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
