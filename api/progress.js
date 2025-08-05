import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "Missing ID" });

  const progress = await redis.get(id);
  res.status(200).json({ progress: progress || 0 });
}