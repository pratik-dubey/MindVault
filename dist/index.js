"use strict";
// we have to use import syntax in typeescript project as require syntax won't give intellisence for express , amd additionally we have to create a "d.ts" file explicitly while making a typescript project to describe types strictly as there is no typescript file in express codebase or type declarations in it so to avoid those errors we do npm install -d @types/express .
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// -D means it is a dev dependency which is used only while development and not while production
const express_1 = __importDefault(require("express"));
// we can use // @ts-ignorets line above any typescript code to ignore type errors
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
dotenv_1.default.config();
const jwt_pass = "jwt_secret";
const dbString = process.env.db_connection_string || "";
if (!dbString) {
    console.error("❌ Database connection string is missing!");
    process.exit(1);
}
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        // Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield db_1.UserModel.create({ username, password: hashedPassword });
        res.status(201).json({ message: "Sign-up Successful!" });
    }
    catch (error) {
        res.status(500).json({ message: "Error during signup", error });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const existingUser = yield db_1.UserModel.findOne({ username });
        if (!existingUser) {
            res.status(401).json({ message: "Invalid username or password" });
            return;
        }
        const isPasswordTrue = yield bcrypt_1.default.compare(password, existingUser.password);
        if (!isPasswordTrue) {
            res.status(401).json({ message: "Invalid username or password" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: existingUser._id }, jwt_pass, {
            expiresIn: "1h",
        });
        res.status(200).json({ message: "Sign-in Successful!", token });
    }
    catch (error) {
        res.status(500).json({ message: "Error during sign-in", error });
    }
}));
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
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = req.body.link;
    const type = req.body.type;
    const title = req.body.title;
    yield db_1.ContentModel.create({
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
}));
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const content = yield db_1.ContentModel.find({
        userId: userId,
    }).populate("userId", "username");
    res.json({
        content,
    });
}));
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    yield db_1.ContentModel.deleteMany({
        _id: contentId,
        // @ts-ignore
        userId: req.userId,
    });
    res.json({
        message: "Content deleted",
    });
}));
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { share } = req.body;
    if (share) {
        const existingLink = yield db_1.linkModel.findOne({
            //@ts-ignore
            userId: req.userId,
        });
        if (existingLink) {
            res.json({
                hash: existingLink.hash,
            });
            return;
        }
        const hashed = (0, utils_1.hashGen)(10);
        yield db_1.linkModel.create({
            // @ts-ignore
            userId: req.userId,
            hash: hashed,
        });
        res.json({
            message: "/share/" + hashed,
        });
    }
    else {
        yield db_1.linkModel.deleteOne({
            //@ts-ignore
            userId: req.userId,
        });
        res.json({
            message: "Removed Link",
        });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const link = yield db_1.linkModel.findOne({
        hash,
    });
    if (!link) {
        res.status(411).json({
            message: "Incorrect input/ Entry not found",
        });
        return;
    }
    const content = yield db_1.ContentModel.find({
        userId: link.userId,
    });
    const user = yield db_1.UserModel.findOne({
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
}));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(dbString);
            console.log("✅ Connected to the database");
            const PORT = 3050;
            app.listen(PORT, () => {
                console.log(`🚀 Server is running on http://localhost:${PORT}`);
            });
        }
        catch (err) {
            console.error("❌ Database connection failed:", err);
            process.exit(1); // Exit if database connection fails
        }
    });
}
main();
