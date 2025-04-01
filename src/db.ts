// Database and Schemas :-
import mongoose, { model } from "mongoose";
import { Model, Schema } from "mongoose";

const User = new Schema({
  username: { type: String, required: true, unique: true },
  //   email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const Content = new Schema({
  title: String,
  link: String,
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "user" },
  type: String,
});

const linkSchema = new Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "user", unique: true },
  hash: String,
});

export const linkModel = model("schema", linkSchema);
export const ContentModel = model("content", Content);
export const UserModel = model("user", User);
