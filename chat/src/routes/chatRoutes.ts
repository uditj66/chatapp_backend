import { Router } from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  createNewChat,
  getAllUserChats,
  getMessagesOfChat,
  sendMessageToUser,
} from "../controllers/chatController.js";
import { upload } from "../middlewares/multer.js";
const router = Router();

router.post("/chat/new", isAuth, createNewChat);
router.get("/chat/allchat", isAuth, getAllUserChats);
router.post("/message", isAuth, upload.single("image"), sendMessageToUser);
router.get("/message/:chatId", isAuth, getMessagesOfChat);
export default router;
