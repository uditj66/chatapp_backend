import mongoose, { Document, Schema } from "mongoose";
export interface IChat extends Document {
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// const chatSchema=new Schema<IChat>({ }) or
const chatSchema: Schema<IChat> = new Schema(
  {
    users: [
      {
        type: String,
        required: true,
      },
    ],
    latestMessage: {
      text: String,
      sender: String,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatModel: mongoose.Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
