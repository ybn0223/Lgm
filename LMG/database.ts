import {Collection, MongoClient} from "mongodb";
import { Minifig, Set } from "./types";
import dotenv from "dotenv";


const apiKey = process.env.REBRICKABLE_API_KEY;

async function fetchData(url: string) {
    try {
        const response = await fetch(`${url}?key=${apiKey}`);
        const data = await response.json();
        let results = data.results;

        // Check if there is a "next" URL in the response
        let nextUrl = data.next;
        while (nextUrl) {
            const nextPageResponse = await fetch(nextUrl);
            const nextPageData = await nextPageResponse.json();
            results = results.concat(nextPageData.results);
            nextUrl = nextPageData.next;
        }

        return results;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}


//alle database gerelateerde code komt hier te staan


dotenv.config();
const uri : string = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
console.log(uri);
const client = new MongoClient(uri);
export const minifigsCollection: Collection<Minifig> = client.db("lego").collection<Minifig>("minifigs");
export const setsCollection: Collection<Set> = client.db("lego").collection<Set>("sets");


async function seed(){
    const minifigsData : any = await fetchData("https://rebrickable.com/api/v3/lego/minifigs/");
    const setsData : any = await fetchData("https://rebrickable.com/api/v3/lego/sets/");

    const minifigs: Minifig[] = minifigsData.results;
    const sets: Set[] = setsData.results;

    if (await minifigsCollection.countDocuments() === 0) {
        await minifigsCollection.insertMany(minifigs);
    }

    if (await setsCollection.countDocuments() === 0) {
        await setsCollection.insertMany(sets);
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