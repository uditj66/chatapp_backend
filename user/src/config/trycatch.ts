import {
  type Request,
  type RequestHandler,
  type Response,
  type NextFunction,
} from "express";
const tryCatch = (handler: RequestHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
      });
    }
  };
};

export default tryCatch;

/*
Our tryCatch function  is an Wrapper function or a Higher-order function

What is a wrapper function?
1.A wrapper function is a function that takes another function as input, and returns a new function that wraps around the original one.
2.The wrapper function can add extra behavior before or after calling the original function, or even modify inputs/outputs.

What is a higher-order function?
A higher-order function is any function that either:
1.Takes one or more functions as arguments, or
2.Returns a function.

Our tryCatch function is a wrapper because:
1.It takes your route handler function,
2.Returns a new function,
3.That runs the original handler safely inside a try-catch,
4.So if the handler throws an error, the wrapper catches it and sends a proper error response.

E.g.
function originalFunction(name) {
  return `Hello, ${name}!`;
}

function wrapper(fn) {
  return function(name) {
    const result = fn(name);             // Call original function
    return result + " Have a nice day!"; // Add something extra
  };
}

const wrappedFunction = wrapper(originalFunction);

console.log(originalFunction("Alice"));  // Output: Hello, Alice!
console.log(wrappedFunction("Alice"));   // Output: Hello, Alice! Have a nice day!

Here,
1.wrapper is the wrapper function.
2.It takes originalFunction as input.
3.Returns a new function that calls originalFunction and adds extra text.


Why use wrapper functions?
1.To add extra features (e.g., error handling, logs) without touching original code.
2.To keep your code clean and avoid repeating code.
3.To control or enhance how a function behaves.
*/
