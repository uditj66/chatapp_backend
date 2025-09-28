import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}
export interface IAuthenticatedRqst extends Request {
  user?: IUser | null;
}
export const isAuth = async (
  req: IAuthenticatedRqst,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Please login : No Auth Headers",
      });
      return;
    }
    const token = authHeader.split(" ")[1]!;
    const JWT_SECRET = process.env.JWT_SECRET!;
    const decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decodedToken || !decodedToken.user) {
      res.status(401).json({
        message: "INVALID TOKEN",
      });
      return;
    }
    req.user = decodedToken.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please login -JWT ERROR",
    });
  }
};
