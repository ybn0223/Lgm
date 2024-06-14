import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import MongoStore from 'connect-mongo';
import { connect, minifigsCollection, setsCollection, userMinifigCollection } from "./database";
import authRoutes from './routes/auth';
import resetRoutes from './routes/resetPass';
import { ensureAuthenticated, ensureNotAuthenticated } from './middlewares/authMiddleware';

// Configure environment variables
dotenv.config();

const app: Express = express();

// Session store configuration
const store = new MongoStore({
  mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/lego",
  collectionName: 'sessions'
});

store.on('error', function(error: any) {
  console.error(error);
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'default_secret', // Use your own secret key
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Middleware setup
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

// Routes
app.use(authRoutes);
app.use(resetRoutes);

// Route handlers
app.get("/", ensureNotAuthenticated, (req, res) => {
  let userExists = false;
  let wrongCredentials = false;
  let emailNotFound = false;
  res.render("index", { user: req.session.user, userExists, wrongCredentials, emailNotFound });
});

app.get("/blacklist", ensureAuthenticated, async (req, res) => {
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
  const user = req.session.user;
  res.render("blacklist", { minifigsShow, user });
});

app.get("/home", ensureAuthenticated, (req, res) => {
  res.render("home", { user: req.session.user });
});

app.get("/summary", ensureAuthenticated, (req, res) => {
  res.render("summary", { user: req.session.user });
});

app.get("/sets", ensureAuthenticated, async (req, res) => {
  let setsShow = [];
  try {
    const minifigs = await setsCollection.aggregate([
      { $match: { set_img_url: { $exists: true }, name: { $exists: true }, set_num: { $exists: true } } },
      { $sample: { size: 10 } }
    ]).toArray();
    setsShow = minifigs;
  } catch (error) {
    console.error('Error fetching minifigs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  const user = req.session.user;
  res.render("sets", { setsShow, user });
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
  const user = req.session.user;
  res.render("sort", { minifigsShow, user });
});

app.post("/addToCollection", async (req, res) => {
  try {
    const { minifigId, userId } = req.body;

    // Perform any necessary validation

    // Add the minifig ID to the user's collection in the database
    await userMinifigCollection.findOneAndUpdate(
      { userId },
      { $addToSet: { minifigs: minifigId } }
    );

    // Send a success response
    res.status(200).json({ message: "Minifig added to collection successfully." });
  } catch (error) {
    console.error("Error adding minifig to collection:", error);
    // Send an error response
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/contact", ensureAuthenticated, (req, res) => {
  res.render("contact", { user: req.session.user });
});

app.get("/collection", ensureAuthenticated, async (req, res) => {
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
  const user = req.session.user;
  res.render("collection", { minifigsShow, user });
});

// Handle 404 - Page Not Found
app.use((req, res) => {
  let userExists = false;
  let wrongCredentials = false;
  res.render("404", { user: req.session.user, userExists, wrongCredentials });
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  await connect();
  console.log(`Server started on http://localhost:${PORT}`);
});