// we have to use import syntax in typeescript project as require syntax won't give intellisence for express , amd additionally we have to create a "d.ts" file explicitly while making a typescript project to describe types strictly as there is no typescript file in express codebase or type declarations in it so to avoid those errors we do npm install -d @types/express .

// -D means it is a dev dependency which is used only while development and not while production

import express from "express";
// we can use // @ts-ignorets line above any typescript code to ignore type errors
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel, ContentModel, linkModel } from "./db";
import dotenv from "dotenv";
import bcrypt, { hash } from "bcrypt";
import { Request, Response } from "express";
import { userMiddleware } from "./middleware";
import { hashGen } from "./utils";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();
const jwt_pass = "jwt_secret";

const dbString = process.env.db_connection_string || "";
if (!dbString) {
  console.error("❌ Database connection string is missing!");
  process.exit(1);
}

app.post("/api/v1/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await UserModel.create({ username, password: hashedPassword });

    res.status(201).json({ message: "Sign-up Successful!" });
  } catch (error) {
    res.status(500).json({ message: "Error during signup", error });
  }
});

app.post("/api/v1/signin", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const existingUser = await UserModel.findOne({ username });
    if (!existingUser) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const isPasswordTrue = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordTrue) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const token = jwt.sign({ id: existingUser._id }, jwt_pass, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Sign-in Successful!", token });
  } catch (error) {
    res.status(500).json({ message: "Error during sign-in", error });
  }
});

// app.post("/api/v1/content", userMiddleware, async (req, res) => {
//   const { link, title } = req.body;

//   await ContentModel.create({
//     link,
//     title,
//     type: req.body.type,
//     tags: [],
//     // @ts-ignore
//     userId: req.userId,
//   });

//   res.json({
//     message: "Content Added",
//   });
// });

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const link = req.body.link;
  const type = req.body.type;
  const title = req.body.title;
  await ContentModel.create({
    link,
    type,
    title,
    // @ts-ignore
    userId: req.userId,
    tags: [],
  });

  res.json({
    message: "Content added",
  });
});
app.get("/api/v1/content", userMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  const content = await ContentModel.find({
    userId: userId,
  }).populate("userId", "username");

  res.json({
    content,
  });
});
app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;

  await ContentModel.deleteMany({
    _id: contentId,
    // @ts-ignore
    userId: req.userId,
  });
  res.json({
    message: "Content deleted",
  });
});
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const { share } = req.body;
  if (share) {
    const existingLink = await linkModel.findOne({
      //@ts-ignore
      userId: req.userId,
    });

    if (existingLink) {
      res.json({
        hash: existingLink.hash,
      });
      return;
    }
    const hashed = hashGen(10);
    await linkModel.create({
      // @ts-ignore
      userId: req.userId,
      hash: hashed,
    });

    res.json({
      message: "/share/" + hashed,
    });
  } else {
    await linkModel.deleteOne({
      //@ts-ignore
      userId: req.userId,
    });

    res.json({
      message: "Removed Link",
    });
  }
});
app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;

  const link = await linkModel.findOne({
    hash,
  });

  if (!link) {
    res.status(411).json({
      message: "Incorrect input/ Entry not found",
    });
    return;
  }

  const content = await ContentModel.find({
    userId: link.userId,
  });

  const user = await UserModel.findOne({
    _id: link.userId,
  });

  if (!user) {
    res.status(411).json({
      message: "User not found , error should not happen ideally",
    });
    return;
  }

  res.json({
    username: user.username,
    content: content,
  });
});

async function main() {
  try {
    await mongoose.connect(dbString);
    console.log("✅ Connected to the database");

    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Exit if database connection fails
  }
}
main();
