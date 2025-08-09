// worker.js
import { fillSurvey } from './helper/helper.js';
import { Redis } from '@upstash/redis';
import { MongoClient, ServerApiVersion } from 'mongodb';

const argvCode = process.argv.find(a => a.startsWith('--code='))?.split('=')[1];
const code = argvCode || process.env.INPUT_CODE;
if (!code) {
  console.error('No code provided.');
  process.exit(1);
}

// Upstash (reads REST URL/TOKEN from env)
// ensure UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN are set in GH secrets
const redis = Redis.fromEnv();

// Mongo (read MONGO_URI from secrets)
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});
const codesDb = client.db("Mc_Donalds_Survey").collection("codes");

console.log('Starting fillSurvey for', code);
try {
  await fillSurvey(
    code,
    (percentProgress) => {
      // set progress in redis; Upstash handles simple string values
      redis.set(code, percentProgress).catch(console.error);
    },
    codesDb,
    (log) => console.log('[fillSurvey]', log)
  );
  console.log('Worker finished.');
  process.exit(0);
} catch (err) {
  console.error('Worker error', err);
  redis.set(code, 'error').catch(() => {});
  process.exit(1);
}
