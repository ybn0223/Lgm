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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = exports.exit = exports.connect = exports.Sets = exports.Minifigs = exports.blacklistCollection = exports.userMinifigCollection = exports.usersCollection = exports.setsCollection = exports.minifigsCollection = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
dotenv_1.default.config();
const apiKey = (_a = process.env.REBRICKABLE_API_KEY) !== null && _a !== void 0 ? _a : "";
const rateLimitDelayMs = 3000; // Adjust this value based on the API's rate limits
function fetchData(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${url}?key=${apiKey}`);
            const data = yield response.json();
            if (!data.results) {
                throw new Error('No results found in API response');
            }
            let results = data.results;
            // Check if there is a "next" URL in the response
            let nextUrl = data.next;
            let i = 0;
            while (nextUrl) {
                yield new Promise(resolve => setTimeout(resolve, rateLimitDelayMs)); // rate limit
                console.log(i);
                i++;
                const nextPageResponse = yield fetch(nextUrl); // fetches next page of api
                const nextPageData = yield nextPageResponse.json();
                results = results.concat(nextPageData.results); // concat to previous api call results
                nextUrl = nextPageData.next; // update the new page number
            }
            console.log(results);
            return results;
        }
        catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    });
}
// Account related code here
function registerUser(email, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userExists = yield exports.usersCollection.findOne({ username });
            if (userExists) {
                return 'User already exists';
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const newUser = {
                email,
                username,
                password: hashedPassword,
            };
            yield exports.usersCollection.insertOne(newUser);
            return 'User registered successfully';
        }
        catch (error) {
            console.error('Error registering user:', error);
            return 'Server error';
        }
    });
}
exports.registerUser = registerUser;
// All database related code comes here
const uri = (_b = process.env.MONGODB_URI) !== null && _b !== void 0 ? _b : "mongodb://localhost:27017";
console.log(uri);
const client = new mongodb_1.MongoClient(uri);
exports.minifigsCollection = client.db("lego").collection("minifigs");
exports.setsCollection = client.db("lego").collection("sets");
exports.usersCollection = client.db("lego").collection("users");
exports.userMinifigCollection = client.db("lego").collection("userMinifigCollection");
exports.blacklistCollection = client.db("lego").collection("blacklist");
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield exports.minifigsCollection.countDocuments()) === 0) {
            const minifigsData = yield fetchData("https://rebrickable.com/api/v3/lego/minifigs/");
            const minifigs = minifigsData;
            console.log('Minifigs data:', minifigs);
            yield exports.minifigsCollection.insertMany(minifigs);
        }
        if ((yield exports.setsCollection.countDocuments()) === 0) {
            const setsData = yield fetchData("https://rebrickable.com/api/v3/lego/sets/");
            const sets = setsData;
            yield exports.setsCollection.insertMany(sets);
        }
    });
}
function Minifigs() {
    return __awaiter(this, void 0, void 0, function* () {
        let cursor = client.db("lego").collection("minifigs").find({});
        let minifigs = yield cursor.toArray();
        return minifigs;
    });
}
exports.Minifigs = Minifigs;
function Sets() {
    return __awaiter(this, void 0, void 0, function* () {
        let cursor = client.db("lego").collection("sets").find({});
        let sets = yield cursor.toArray();
        return sets;
    });
}
exports.Sets = Sets;
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Connection with database started");
            yield seed();
            process.on("SIGNINT", exit);
        }
        catch (e) {
            console.error(e);
        }
    });
}
exports.connect = connect;
function exit() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.close();
            console.log("Disconnected from database");
        }
        catch (e) {
            console.error(e);
        }
        finally {
            process.exit(0);
        }
    });
}
exports.exit = exit;
