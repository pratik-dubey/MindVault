import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const jwt_pass = "jwt_secret";

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  const decoded = jwt.verify(header as string, jwt_pass);

  if (decoded) {
    //@ts-ignore
    req.userId = decoded.id;
    next();
  } else {
    res.status(403).send({
      message: "❌ You are not logged in",
    });
  }
};
