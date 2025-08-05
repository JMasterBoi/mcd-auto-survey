import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: "Missing Code" });

  const progress = await redis.get(code);
  res.status(200).json({ progress: progress || 0 });
}