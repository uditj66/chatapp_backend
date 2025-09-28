import express, { Router } from "express";
import {
  getAllUsers,
  getAUser,
  loginUser,
  myProfile,
  updateName,
  verifyUser,
} from "../controllers/userController.js";
import { isAuth } from "../middleware/isAuth.js";
// const router = express.Router();
const router = Router();
router.post("/login", loginUser);
router.post("/verifyuser", verifyUser);
router.get("/me", isAuth, myProfile); //is Auth is middleware  here that's why we use next()in isAuth function.After the middleware runs the "/me"route handles myProfile function
router.post("/user/update", isAuth, updateName);
router.get("/users/all", isAuth, getAllUsers);
router.get("/user/:id", getAUser);
/*
Why use : before id?
1.In the route /user/:id, the :id means "capture whatever value appears at this position in the URL and assign it to the parameter id."
2.Express treats anything after : as a variable name.
3.When a request comes in, for example /user/68a20d6709c49e0abb851db3, Express extracts 68a20d6709c49e0abb851db3 and makes it available as req.params.id inside your route handler.
4.This allows you to create dynamic URLs where parts can change and still match the route pattern

NOTES:-
1.app.get('/hello', ...)
=>Defines a route directly on the app for GET requests to /hello.
=>Used for simple or small apps where you define all routes in one place.

2.router.post('/login', loginUser)
=>Defines a route on a router object that handles POST requests to /login.
=>Routers let you group your route handlers modularly by features and paths (e.g., all auth routes in an "auth" router).
=>You then “mount” the router on your app like:

Notes:-
1.router.post("/login", loginUser);
or 
2.router.route("/login").post(loginUser);
both have same function but if we have multiple handler for the same route then we do chaining on the second option
*/
export default router;

// Note:- We have exported router from this file ,but we have imported it as userRoute in index.ts file so don't confuse with this as the export is default so that's why we can import it with any name in any other file
