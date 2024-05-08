import {Collection, MongoClient} from "mongodb";
import { Minifig, Set } from "./types";
import dotenv from "dotenv";
import fetch from 'node-fetch'; // Import fetch function

async function fetchData(url : string) {
    const response = await fetch(url);
    return response.json();
}


//alle database gerelateerde code komt hier te staan


dotenv.config();
const uri : string = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
console.log(uri);
const client = new MongoClient(uri);
export const minifigsCollection: Collection<Minifig> = client.db("lego").collection<Minifig>("minifigs");
export const setsCollection: Collection<Set> = client.db("lego").collection<Set>("sets");


async function seed(){
    const minifigsData : any = await fetchData("https://rebrickable.com/api/v3/lego/minifigs/?key=156352079ec5150f9017d91bd04447f1");
    const setsData : any = await fetchData("https://rebrickable.com/api/v3/lego/sets/?key=156352079ec5150f9017d91bd04447f1");

    const minifigs: Minifig[] = minifigsData.results;
    const sets: Set[] = minifigsData.results;

    if (await minifigsCollection.countDocuments() === 0) {
        await minifigsCollection.insertMany(minifigsData);
    }

    if (await setsCollection.countDocuments() === 0) {
        await setsCollection.insertMany(setsData);
    }
}

export async function Minifigs() {

    let cursor = client.db("lego").collection("minifigs").find<Minifig>({});
    let minifigs : Minifig[] = await cursor.toArray();
    return minifigs;
}

export async function Sets() {

    let cursor = client.db("lego").collection("sets").find<Set>({});
    let sets : Set[] = await cursor.toArray();
    return sets;
}

async function connect(){ //start connectie
    try {
        await client.connect();
        console.log("Connection with database started");
        await seed();
        process.on("SIGNINT", exit);
    } catch (e) {
        console.error(e);
    }
}

async function exit(){ //dit sluit connectie met DB op exit
    try {
        await client.close();
        console.log("Disconnected from database");
    } catch (e) {
        console.error(e)
    }
    finally{
        process.exit(0);
    }
}

export{connect, exit}