import axios from 'axios';

export default async function handler(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'missing code' });

  // Repo info
  const GITHUB_OWNER = process.env.GH_REPO_OWNER; // e.g. "your-username"
  const GITHUB_REPO = process.env.GH_REPO_NAME;   // e.g. "mcd-survey-worker"
  const WORKFLOW_FILE = 'fill-survey.yml'; // name of the workflow file above
  const GITHUB_TOKEN = process.env.GITHUB_PAT; // PAT stored in env on your server

  if (!GITHUB_TOKEN) return res.status(500).json({ error: 'missing GITHUB_PAT on server' });

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  console.log("url: ", url)
  console.log("GITHUB_OWNER: ", GITHUB_OWNER)
  console.log("GITHUB_REPO: ", GITHUB_REPO)
  console.log("GITHUB_TOKEN: ", GITHUB_TOKEN)
  try {
    await axios.post(url,
      { ref: 'main', inputs: { code } },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );

    res.status(200).json({ message: 'workflow-dispatched' });
  } catch (err) {
    console.error('GitHub dispatch error', err?.response?.data ?? err.message);
    res.status(500).json({ error: 'failed to dispatch' });
  }
}



// import {fillSurvey} from "../helper/helper.js"
// import { Redis } from '@upstash/redis'
// import { MongoClient, ServerApiVersion } from 'mongodb'

// const codesDb = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// }).db("Mc_Donalds_Survey").collection("codes");

// const redis = Redis.fromEnv()

// export default async function handler(req, res) {
//   console.log("Starting survey fill...");
  

//   req.setTimeout(60000);
//   res.setTimeout(60000);

//   const { code } = req.body;
//   if (!code) {res.status(400).json({"error": "code is missing"}); return;}
//   console.log(code)
  
  
//   fillSurvey(code, (percentProgress) => {
//     redis.set(code, percentProgress)
//   }, codesDb, (log) => {
//     console.log(log)
//   });
//   res.status(200).json({message: "started survey"});
// }