import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app : Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

app.get("/", (req, res) => {
    res.render("index")
});

app.get("/blacklist", (req, res) => {
    res.render("blacklist")
})

app.get("/home", (req, res) => {
    res.render("home")
});

// app.use('/images', express.static('public/images'));

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get('port'));
});