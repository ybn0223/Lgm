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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
const auth_1 = __importDefault(require("./routes/auth"));
const resetPass_1 = __importDefault(require("./routes/resetPass"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
// Configure environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Session store configuration
const store = new connect_mongo_1.default({
    mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/lego",
    collectionName: 'sessions'
});
store.on('error', function (error) {
    console.error(error);
});
// Session configuration
app.use((0, express_session_1.default)({
    secret: (_a = process.env.SESSION_SECRET) !== null && _a !== void 0 ? _a : 'default_secret', // Use your own secret key
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
// Middleware setup
app.set("view engine", "ejs");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.set('views', path_1.default.join(__dirname, "views"));
// Routes
app.use(auth_1.default);
app.use(resetPass_1.default);
// Route handlers
app.get("/", authMiddleware_1.ensureNotAuthenticated, (req, res) => {
    let userExists = false;
    let wrongCredentials = false;
    let emailNotFound = false;
    res.render("index", { user: req.session.user, userExists, wrongCredentials, emailNotFound });
});
app.get("/home", authMiddleware_1.ensureAuthenticated, (req, res) => {
    res.render("home", { user: req.session.user });
});
app.get("/summary", authMiddleware_1.ensureAuthenticated, (req, res) => {
    res.render("summary", { user: req.session.user });
});
app.get("/sets", authMiddleware_1.ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let setsShow = [];
    try {
        const minifigs = yield database_1.setsCollection.aggregate([
            { $match: { set_img_url: { $exists: true }, name: { $exists: true }, set_num: { $exists: true } } },
            { $sample: { size: 10 } }
        ]).toArray();
        setsShow = minifigs;
    }
    catch (error) {
        console.error('Error fetching minifigs:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    const user = req.session.user;
    res.render("sets", { setsShow, user });
}));
app.get("/sort", authMiddleware_1.ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let minifigsShow = [];
    try {
        const minifigs = yield database_1.minifigsCollection.aggregate([
            { $match: { set_img_url: { $exists: true }, name: { $exists: true }, set_num: { $exists: true } } },
            { $sample: { size: 10 } }
        ]).toArray();
        minifigsShow = minifigs;
    }
    catch (error) {
        console.error('Error fetching minifigs:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    const user = req.session.user;
    res.render("sort", { minifigsShow, user });
}));
app.get('/collection', authMiddleware_1.ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Controleer of req.session.user gedefinieerd is
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    try {
        // Haal de gebruiker zijn minifig collecties op
        const userMinifigCollectionDocument = yield database_1.userMinifigCollection.findOne({ userId: req.session.user._id });
        // Controleer of er minifigs zijn voor deze gebruiker
        if (!userMinifigCollectionDocument || !userMinifigCollectionDocument.minifigs) {
            return res.render('collection', { minifigsShow: [], user: req.session.user });
        }
        // Haal de minifigId's uit de document
        const minifigIds = userMinifigCollectionDocument.minifigs.map((id) => new mongodb_1.ObjectId(id));
        // Zoek de daadwerkelijke minifiguren op basis van de minifigIds
        const minifigs = yield database_1.minifigsCollection.find({ _id: { $in: minifigIds } }).toArray();
        // Render de collection view en geef de minifigs en user door
        res.render('collection', { minifigsShow: minifigs, user: req.session.user });
    }
    catch (err) {
        console.error('Error fetching minifigs:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.post('/collection/delete/:minifigId', authMiddleware_1.ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    const { minifigId } = req.params;
    if (!minifigId) {
        return res.status(400).json({ error: 'minifigId is required' });
    }
    try {
        const result = yield database_1.userMinifigCollection.updateOne({ userId: { $eq: req.session.user._id } }, // Alternatieve benadering met $eq operator
        { $pull: { minifigs: minifigId } } // Verwijder de minifigId uit de array
        );
        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Minifig not found in collection' });
        }
        res.redirect('/collection'); // Omleiden naar de collectiepagina na verwijdering
    }
    catch (err) {
        console.error('Error deleting minifig:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
//BLACKLISTEN-WERKRUIMTE
app.post("/addToBlacklist", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { minifigId } = req.body;
        console.log('Blacklisted minifigId:', minifigId); // Voeg deze logging toe
        // Controleer of de minifiguur bestaat voordat je hem aan de blacklist toevoegt
        const minifig = yield database_1.minifigsCollection.findOne({ _id: mongodb_1.ObjectId.createFromHexString(minifigId) });
        if (!minifig) {
            return res.status(404).json({ error: "Minifig not found." });
        }
        const minifigImgUrl = minifig.set_img_url;
        // Voeg de minifiguur toe aan de blacklist, inclusief relevante informatie
        yield database_1.blacklistCollection.insertOne({
            _id: minifig._id,
            name: minifig.name,
            minifig_img_url: minifigImgUrl,
            // Voeg andere relevante velden toe zoals num_parts, set_num, etc. indien nodig
        });
        // Stuur een succesrespons terug
        res.status(200).json({ message: "Minifig added to blacklist successfully." });
    }
    catch (error) {
        console.error("Error adding minifig to blacklist:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.get("/blacklist", authMiddleware_1.ensureAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Haal de minifiguren op die op de blacklist staan
        const blacklistMinifigs = yield database_1.blacklistCollection.find({}).toArray();
        // Render de blacklist.ejs template en geef de juiste data door
        res.render("blacklist", { blacklistMinifigs, user: req.session.user });
    }
    catch (error) {
        console.error('Error fetching blacklist minifigs:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.delete("/removeFromBlacklist/:minifigId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { minifigId } = req.params;
    try {
        const deletedMinifig = yield database_1.blacklistCollection.findOneAndDelete({ _id: mongodb_1.ObjectId.createFromHexString(minifigId) });
        if (!deletedMinifig) {
            return res.status(404).json({ error: "Minifig not found in blacklist." });
        }
        res.status(200).json({ message: "Minifig removed from blacklist successfully." });
    }
    catch (error) {
        console.error("Error removing minifig from blacklist:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/addToUserMinifigCollection", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, minifigId } = req.body;
        // Controleer of userId en minifigId correct zijn ingevuld
        if (!userId || !minifigId) {
            return res.status(400).json({ error: "Invalid request body." });
        }
        console.log('Collected minifigId:', minifigId);
        // Voeg de minifig toe aan de gebruikerscollectie
        const result = yield database_1.userMinifigCollection.updateOne({ userId }, {
            $setOnInsert: { userId },
            $addToSet: { minifigs: minifigId }
        }, { upsert: true });
        if (result.modifiedCount === 0 && result.upsertedCount === 0) {
            throw new Error("Failed to add minifig to collection.");
        }
        // Stuur een succesrespons terug
        res.status(200).json({ message: "Minifig added to user collection successfully." });
    }
    catch (error) {
        console.error("Error adding minifig to user collection:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
// Handle 404 - Page Not Found
app.use((req, res) => {
    let userExists = false;
    let wrongCredentials = false;
    res.render("404", { user: req.session.user, userExists, wrongCredentials });
});
// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.connect)();
    console.log(`Server started on http://localhost:${PORT}`);
}));
