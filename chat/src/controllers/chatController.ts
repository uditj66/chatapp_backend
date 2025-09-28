import { getReceiverSocketId, io } from "./../config/socket.js";
import type { NextFunction, Request, Response } from "express";
import tryCatch from "../config/trycatch.js";
import type { IAuthenticatedRqst } from "../middlewares/isAuth.js";
import { ChatModel } from "../models/Chat.js";
import { MessageModel } from "../models/Messages.js";
import axios from "axios";

// creating new chat for the user
export const createNewChat = tryCatch(
  async (req: IAuthenticatedRqst, res: Response, next: NextFunction) => {
    console.log("Create chat request body:", req.body);
    console.log("Authenticated user:", req.user);

    const userId = req.user?._id;
    const { otherUserId } = req.body;

    console.log("UserId from auth:", userId);
    console.log("OtherUserId from body:", otherUserId);

    if (!otherUserId) {
      res.status(400).json({
        message: "Other userId is required ",
      });
      return;
    }

    // checking if there is any existing chat of logged-in user with any other user
    const existingChat = await ChatModel.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });
    /*
    NOTES:-
    What this does, step by step:
    ChatModel.findOne(...) searches the database in the ChatModel collection for one document matching the condition inside { ... }.

    The condition looks for documents where the field named users (which is expected to be an array) satisfies two things:

    $all: [userId, otherUserId]
    This means the users array must contain both userId and otherUserId. The order doesn't matter, but both must be present in the array.

    $size: 2
    This means the users array's length must be exactly 2. So the array contains no more and no less than these two users.
     */

    // if there is an existing chat exist
    if (existingChat) {
      res.json({
        message: "chat already exists",
        chatid: existingChat._id,
      });
      return;
    }

    // creating new chat if there is no existing chat
    const createNewChat = await ChatModel.create({
      users: [userId, otherUserId],
    });
    res.status(201).json({
      message: "New chat created Successfully",
      chatid: createNewChat._id,
    });
  }
);

export const getAllUserChats = tryCatch(
  async (req: IAuthenticatedRqst, res: Response) => {
    // taking userId from logged-in user
    const userId = req.user?._id;
    if (!userId) {
      res.status(400).json({
        message: "UserId is missing",
      });
      return;
    }
    // allchatOfUsers=array of documents
    const allChatsOfUsers = await ChatModel.find({ users: userId }).sort({
      updatedAt: -1,
    });
    console.log("UserId:", userId);
    console.log("All Chats:", allChatsOfUsers);

    /* 
      Here we are using promise.all , means Promise.all() takes an array of promises (these asynchronous tasks) and waits for all of them to finish.

      It returns:
      1.A new promise that resolves when all promises succeed, or
      2.Rejects immediately if any one of them fails.

      alternatively
      
      Promise.all([...]) takes an array of promises and returns a new single promise.
     ✅ If all promises succeed → it resolves into an array of results (in the same order).
     ❌ If any one promise fails (rejects) → the whole thing rejects with that error.

      we have many chats so we want to run all these async tasks in parallel.
      1.Instead of waiting for each chat’s data one by one (which is slow), Promise.all() allows your code to wait for all the chat-related async calls to complete at the same time.
      2.Once all finish, you get an array of all the chat data combined, so you can send a single response.
 
    */

    // getting otheruser whom the logged-in user are doing chatting
    const chatWithUserData = await Promise.all(
      /*
      Notes:-
      1. chatWithUserData is array of objects bcz promise.all() return a single promise after resolving all the promises it accepts .So the array of objects is that we get from promise.all(), 
      2.chat is a single document from the array of documents.So it says map on array of chat documents and take each chat document and find the otherUserId whom the logged-in user is chatting.
      */
      allChatsOfUsers.map(async (chat) => {
        const otherUserId = chat.users.find((id) => id !== userId);

        const unseenCount = await MessageModel.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          /*
          $ne=>not equal to
          or we can write this also => sender:otherUserId
          */
          seen: false,
        });
        /*
        key features of axios are :-
        1.Promise-based: Supports modern JavaScript async/await syntax for easier asynchronous flow.
        2.Automatic JSON transformation: Automatically converts JSON response data to JavaScript objects.
        3.Supports all HTTP methods: GET, POST, PUT, DELETE, PATCH, etc
        */
        try {
          /* Axios Works in browsers and Node.js: Isomorphic usage i.e Axios simplifies handling HTTP requests and is widely used in frontend and backend JavaScript applications for API communication.
          Here Axios is used as in the backend as it is used to calling another API endpoint (user service) to get user details
          */
          const { data } = await axios.get(
            `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
          );

          return {
            user: data,
            chat: {
              /*
              ...chat.toObject() means we are spreading the chat document and convert it to old javascript object and assigning these properties to chat variable again with adding extra properties like lastestMessage and unseenCount
               */
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              /* chat is a single document obtained by mapping on array of documents where allChatOfUser.map() is used */
              unseenCount:
                unseenCount /* unseenCount is a variable declared above */,
            },
          };
        } catch (error) {
          console.error(error);
          return {
            chat: {
              user: { _id: otherUserId, name: "Unknown User" },
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          };
        }
      })
    );
    res.json({
      // chatsWithUserData is an array of objects containing the data of the users whom our logged-in user chats
      chats: chatWithUserData,
    });
  }
);

// sending messages while chatting
export const sendMessageToUser = tryCatch(
  async (req: IAuthenticatedRqst, res: Response) => {
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file;
    if (!senderId) {
      res.status(401).json({
        message: "Unauthorized👎-Please Login",
      });
      return;
    }
    if (!chatId) {
      res.status(400).json({
        message: "Bad-request👎-chatId is Required",
      });
      return;
    }

    if (!imageFile && !text) {
      res.status(400).json({
        message: "Either text or image is required",
      });
      return;
    }
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        message: "😜Error:404,Chat Not Found",
      });
      return;
    }

    // applying some() method on users array of chat document to find if our logged-in user( sender of the message ) is present in chat or not

    const isUserInChat = chat?.users.some(
      (userId) => userId.toString() === senderId.toString()
    );

    if (!isUserInChat) {
      res.status(403).json({
        message: " You are not the participant of this chat: Unauthorized",
      });
      return;
    }
    // finding the other userId whom our logged-in user is sending the message in a chat
    // Here find() is an method applying on users array of the chatModel,return the element of the array where our condition is matched .
    const otherUserId = chat?.users?.find(
      (userId) => userId.toString() !== senderId.toString()
    );
    if (!otherUserId) {
      res.status(401).json({
        message: "No Other User to whom you are trying to chat",
      });
      return;
    }

    // socket setup
    const receiverSocketId = getReceiverSocketId(otherUserId.toString());
    let isReceiverInChatRoom = false;
    if (receiverSocketId) {
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      if (receiverSocket && receiverSocket.rooms.has(chatId)) {
        isReceiverInChatRoom = true;
      }
    }

    let messageData: any = {
      chatId: chatId,
      sender: senderId,
      seen: isReceiverInChatRoom,
      seenAt: isReceiverInChatRoom ? new Date() : undefined,
    };

    /* Updating the messageData object based on requirement:-

     if messageData is an image then we update the messageData object by adding the property called as image
     if messageData is an text message then we update the messageData object by adding the property called as text.

    */
    if (imageFile) {
      messageData.image = {
        url: imageFile.path,
        publicId: imageFile.filename,
      };
      messageData.messageType = "image";
      messageData.text = text || "";
    } else {
      messageData.messageType = "text";
      messageData.text = text;
    }

    /* Below line makes a new document in messages collection of mongoDb using MessageModel schema.
     Alternativelly we can use await MessageModel.create(messageData) method .There is no need to save() after create() bcz create also runs save() automatically.
    */
    const message = new MessageModel(messageData);

    const savedMessage = await message.save();
    const latestMessageText = imageFile ? "📷 Image" : text;

    // updating our chat-document with latest chat messages
    await ChatModel.findByIdAndUpdate(
      chatId,
      {
        latestMessage: {
          text: latestMessageText,
          sender: senderId,
        },
        updatedAt: new Date(),
      },
      // here new: true means it will return updated document,if new:false then it return the same old document without update fields are applied to this document
      { new: true }
    );

    // emit to sockets
    io.to(chatId).emit("newMessage", savedMessage);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", savedMessage);
    }
    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMesaage", savedMessage);
    }
    if (isReceiverInChatRoom && senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        chatId: chatId,
        seenBy: otherUserId,
        messagesIds: [savedMessage._id],
      });
    }

    res.status(201).json({
      message: savedMessage,
      sender: senderId,
    });
  }
);

export const getMessagesOfChat = tryCatch(
  async (req: IAuthenticatedRqst, res: Response) => {
    const userId = req.user?._id;
    const { chatId } = req.params;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized : please login-in first ",
      });
      return;
    }
    if (!chatId) {
      res.status(400).json({
        message: "chatId is required",
      });
      return;
    }

    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      res.status(404).json({
        message: " 👎error:404 chat not found",
      });
      return;
    }
    const isUserInChat = chat?.users.some(
      (USER_ID) => USER_ID.toString() === userId.toString()
    );

    if (!isUserInChat) {
      res.status(403).json({
        message: " You are not the participant of this chat Unauthorized",
      });
      return;
    }

    // Finding the messages to be marked as seen after messagge is read

    const messagesToMarkAsSeen = await MessageModel.find({
      chatId: chatId,
      sender: { $ne: userId },
      seen: false,
    });

    // Here we have two objects in this updateMany() method
    // 1. filter the documents based on messageModelaccording to the first object conditions
    // 2. After you find all the Documents based on these filter,make updates in these documents field as mentioned in second object
    await MessageModel.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );

    const messages = await MessageModel.find({ chatId }).sort({
      createdAt: 1,
    });
    // 1 means =>Ascending or latest is at last.
    // -1 means => Descending or latest is at first.

    const otherUserId = chat.users.find((id) => id !== userId);
    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
      );
      if (!otherUserId) {
        res.status(400).json({
          message: "No other user is present",
        });
        return;
      }
      // socket work
      if (messagesToMarkAsSeen.length > 0) {
        const otherUserSocketId = getReceiverSocketId(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("messagesSeen", {
            chatId: chatId,
            seenBy: userId,
            messageIds: messagesToMarkAsSeen.map((msg) => {
              msg?._id;
            }),
          });
        }
      }

      res.json({
        messages,
        user: data,
      });
    } catch (error) {
      console.error(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unknown User" },
      });
    }
  }
);
