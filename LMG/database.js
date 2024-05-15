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
exports.exit = exports.connect = exports.Sets = exports.Minifigs = exports.setsCollection = exports.minifigsCollection = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const https_1 = require("https");
const url_1 = require("url");
function fetchData(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const options = (0, url_1.parse)(url);
            const req = (0, https_1.request)(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            req.end();
        });
    });
}
//alle database gerelateerde code komt hier te staan
dotenv_1.default.config();
const uri = (_a = process.env.MONGODB_URI) !== null && _a !== void 0 ? _a : "mongodb://localhost:27017";
console.log(uri);
const client = new mongodb_1.MongoClient(uri);
exports.minifigsCollection = client.db("lego").collection("minifigs");
exports.setsCollection = client.db("lego").collection("sets");
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        const minifigsData = yield fetchData("https://rebrickable.com/api/v3/lego/minifigs/?key=156352079ec5150f9017d91bd04447f1");
        const setsData = yield fetchData("https://rebrickable.com/api/v3/lego/sets/?key=156352079ec5150f9017d91bd04447f1");
        const minifigs = minifigsData.results;
        const sets = setsData.results;
        if ((yield exports.minifigsCollection.countDocuments()) === 0) {
            yield exports.minifigsCollection.insertMany(minifigs);
        }
        if ((yield exports.setsCollection.countDocuments()) === 0) {
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
