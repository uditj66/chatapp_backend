import mongoose, { Document, Schema } from "mongoose";
/* So by writing extends Document, IUser interface:
1. Inherits all the built-in Mongoose document properties/methods
2. Adds our own custom fields (name and email)*/
export interface IUser extends Document {
  name: string;
  email: string;
  token:string
}
const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    token: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel: mongoose.Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

/*
 NOTES:-
1. Doesn't need optional chaining i.e  => models?.User
2. Doesn't need explicit typecasting i.e =>models.User as mongoose.Model<User>
*/
