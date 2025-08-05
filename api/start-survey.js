import {fillSurvey} from "../helper/helper.js"
import { Redis } from '@upstash/redis'
import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = "mongodb+srv://Juanito:3gaDE9iMO3BIeGVh@cluster0.2duv9fo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const codesDb = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
}).db("Mc_Donalds_Survey").collection("codes");

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  console.log("Starting survey fill...");
  

  req.setTimeout(60000);
  res.setTimeout(60000);

  const { code } = req.body;
  if (!code) {res.status(400).json({"error": "code is missing"}); return;}
  console.log(code)
  res.status(200).json({"message": "starting the survey"});


  fillSurvey(code, (percentProgress) => {
      redis.set(code, percentProgress)
  }, codesDb);
}