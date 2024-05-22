"use strict";
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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const database_1 = require("./database");
const auth_1 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
var MongoDBStore = require('connect-mongodb-session')(express_session_1.default);
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/lego",
    collection: 'sessions'
});
store.on('error', function (error) {
    console.error(error);
});
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.set('views', path_1.default.join(__dirname, "views"));
app.use((0, express_session_1.default)({
    secret: 'your_secret_key', // Replace with your own secret key
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.set("port", process.env.PORT || 10000);
app.get("/", (req, res) => {
    res.render("index", { user: req.session.user });
    console.log({ user: req.session.user });
});
// Use the auth routes for handling registration and login
app.use(auth_1.default);
app.get("/blacklist", (req, res) => {
    res.render("blacklist", { user: req.session.user });
});
app.get("/home", (req, res) => {
    res.render("home", { user: req.session.user });
});
app.get("/summary", (req, res) => {
    res.render("summary", { user: req.session.user });
});
app.get("/sets", (req, res) => {
    res.render("sets", { user: req.session.user });
});
app.get("/sort", (req, res) => {
    res.render("sort", { user: req.session.user });
});
app.get("/contact", (req, res) => {
    res.render("contact", { user: req.session.user });
});
app.get("/collection", (req, res) => {
    res.render("collection", { user: req.session.user });
});
app.listen(app.get("port"), () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connect)();
    console.log("Server started on http://localhost:" + app.get('port'));
}));
