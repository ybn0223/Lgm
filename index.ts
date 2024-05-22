import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import connectMongo from "connect-mongodb-session";
import { connect } from "./database";
import authRoutes from './routes/auth';

dotenv.config();
var MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/lego",
  collection: 'sessions'
});

store.on('error', function(error : any) {
  console.error(error);
});

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.use(session({
  secret: 'your_secret_key',  // Replace with your own secret key
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.set("port", process.env.PORT || 10000);

app.get("/", (req , res) => {
    res.render("index", { user: req.session.user }
    );
});

// Use the auth routes for handling registration and login
app.use(authRoutes);

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

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get('port'));
});
