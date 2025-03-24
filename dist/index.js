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
dotenv_1.default.config();
const jwt_pass = "jwt_secret";
const dbString = process.env.db_connection_string || "";
if (!dbString) {
    console.error("❌ Database connection string is missing!");
    process.exit(1);
}
const app = (0, express_1.default)();
app.use(express_1.default.json());
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
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link, title } = req.body;
    yield db_1.ContentModel.create({
        link,
        title,
        tags: [],
        // @ts-ignore
        userId: req.userId,
    });
    res.json({
        message: "Content Added",
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
app.delete("/api/v1/content", (req, res) => { });
app.post("/api/v1/brain/share", (req, res) => { });
app.get("/api/v1/brain/:shareLink", (req, res) => { });
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(dbString);
            console.log("✅ Connected to the database");
            const PORT = 3001;
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
