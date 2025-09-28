import mongoose, { Document, Schema, Types } from "mongoose";
export interface IMessage extends Document {
  chatId: Types.ObjectId;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema: Schema<IMessage> = new Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      // We know that the  collection is created after pleuralization and with lowercase.So please always put model name not collection name in ref
      required: true,
      // required : true means This field should have an initial value before saving this document,either you provide its initial value through req.body or any other way
    },
    sender: {
      type: String,
      required: true,
    },
    text: String,

    image: {
      url: String,
      publicId: String,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

export const MessageModel: mongoose.Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
