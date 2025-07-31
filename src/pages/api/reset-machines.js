// /api/reset-machines.js
import { redis } from "@/lib/redis";

export default async function handler(req, res) {
	if (req.method !== "POST") return res.status(405).end();

	await redis.set("machines", []);
	return res.status(200).json({ message: "Machines list reset" });
}
