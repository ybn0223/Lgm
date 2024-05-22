import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import {connect} from "./database";


dotenv.config();

const app : Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 10000);

app.get("/", (req, res) => {
    res.render("index")
});

// Route handler for POST request to handle registration
app.post('/register', (req, res) => {
    console.log(req.body);
  });
  
app.get("/blacklist", (req, res) => {
    res.render("blacklist")
})

app.get("/home", (req, res) => {
    res.render("home")
});

app.get("/summary", (req, res) => {
    res.render("summary")
});
app.get("/sets", (req, res) => {
    res.render("sets")
});

app.get("/sort", (req, res) => {
    res.render("sort")
});

app.get("/contact", (req, res) => {
    res.render("contact")
});

app.get("/collection", (req, res) => {
    res.render("collection")
});
// app.use('/images', express.static('public/images'));

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get('port'));
});