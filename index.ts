import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import { connect, minifigsCollection } from "./database";
import authRoutes from './routes/auth';
import { ensureAuthenticated, ensureNotAuthenticated } from './middlewares/authMiddleware';

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
  secret: 'your_secret_key',  // MAAK HIER EEN HASHED CODE VOOR!!!!
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.set("port", process.env.PORT || 10000);

app.get("/", (req , res) => {
    let userExists : boolean = true;
    res.render("index", { user: req.session.user, userExists }
    );
});

// Use the auth routes for handling registration and login
app.use(authRoutes);

app.get("/blacklist",ensureAuthenticated, (req, res) => {
    res.render("blacklist", { user: req.session.user });
});

app.get("/home", ensureAuthenticated, (req, res) => {
    res.render("home", { user: req.session.user });
});

app.get("/summary", ensureAuthenticated, (req, res) => {
    res.render("summary", { user: req.session.user });
});

app.get("/sets", ensureAuthenticated, (req, res) => {
    res.render("sets", { user: req.session.user });
});

app.get("/sort", ensureAuthenticated, async (req, res) => {
    let minifigsShow = [];
    try {
      const minifigs = await minifigsCollection.aggregate([
        { $match: { set_img_url: { $exists: true }, name: { $exists: true }, set_num: { $exists: true } } },
        { $sample: { size: 10 } }
      ]).toArray();
  
      minifigsShow = minifigs;
    } catch (error) {
      console.error('Error fetching minifigs:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.render("sort", { minifigsShow });
  }); 

app.get("/contact", ensureAuthenticated, (req, res) => {
    res.render("contact", { user: req.session.user });
});

app.get("/collection", ensureAuthenticated, (req, res) => {
    res.render("collection", { user: req.session.user });
});

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get('port'));
});