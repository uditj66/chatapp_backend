import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import { app,server } from "./config/socket.js";
cors;
// ../routes/chatRoute.js means go up one dir and i.e src->routes->chatRouts.js
// ./routes/chatRoute.js  means from where i am now go directly to routes->chatRoute.js
dotenv.config();
const port = process.env.PORT;
connectDb();
app.use(express.json());
app.use(cors());
app.use("/api/v1", chatRoutes);
server.listen(port, () => {
  console.log(`App running on port ${port}`);
});
