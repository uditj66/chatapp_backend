import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export interface IAuthenticatedRqst extends Request {
  user?: IUser | null;
}

export const isAuth = (
  req: IAuthenticatedRqst,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    /*
    # What it does:
    =>req is the object representing the incoming HTTP request in Express.

    =>req.headers is an object containing all the headers sent by the client in the HTTP request.

    =>authorization is a special header where clients usually send their authentication credentials, like a token or username/password.

    =>This line tries to read the value of the Authorization header from the incoming request.

    =>The value is assigned to the variable authHeader for further use.

    # Why is it important?
    =>When you use token-based authentication like JWT, the client sends the token inside this header, usually like:
    Authorization: Bearer gferuifheuifheuifgeyugdhvwygd

    #By reading req.headers.authorization, your server can get the token from the request in order to:
    =>Verify the token’s validity
    =>Authenticate the user
    =>Give access to protected resources
    
    */
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "please login - No auth Header i.e. No token in header ",
      });
      return;
    }
    const token = authHeader.split(" ")[1]!;
    // Splitting the string into seperate words and accessing the second word from the string that's why passes 1  in array
    const SECRET = process.env.JWT_SECRET!;
    const decodedToken = jwt.verify(token, SECRET) as JwtPayload;
    // The as JwtPayload part is a TypeScript type assertion telling the compiler: "treat the returned decoded data as an object of type JwtPayload".

    if (!decodedToken || !decodedToken.user) {
      res.status(401).json({
        message: "Inavalid Token",
      });
      return;
    }
    req.user = decodedToken.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please login -JWT Error",
    });
  }
};
