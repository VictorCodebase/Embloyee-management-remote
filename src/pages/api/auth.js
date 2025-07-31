// pages/api/auth.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const MACHINES_KEY = "machines";

async function getMachines() {
	const data = await redis.get(MACHINES_KEY);
	return data || { machines: [] };
}

async function setMachines(data) {
	await redis.set(MACHINES_KEY, data);
}

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { machineId, companyName } = req.query;

	if (!machineId) {
		return res.status(401).json({ error: "Machine ID is required" });
	}

	const company = companyName || machineId;
	console.info("Auth check for:", machineId, "| Company:", company);

	try {
		const data = await getMachines();
		let machine = data.machines.find((m) => m.id === machineId);

		if (!machine) {
			console.log(`New machine attempting access: ${machineId}`);

			machine = {
				id: machineId,
				name: `Machine ${machineId.substring(0, 8)}: (${company})`,
				allowed: false,
				lastSeen: new Date().toISOString(),
				dateAdded: new Date().toISOString(),
			};

			data.machines.push(machine);
			await setMachines(data);

			return res.status(401).json({
				status: "unauthorized",
				message: "Machine not authorized. Contact administrator.",
			});
		}

		// Update lastSeen
		machine.lastSeen = new Date().toISOString();
		const index = data.machines.findIndex((m) => m.id === machineId);
		data.machines[index] = machine;
		await setMachines(data);

		if (machine.allowed) {
			return res.status(200).json({
				status: "authorized",
				message: "Access granted",
			});
		} else {
			return res.status(401).json({
				status: "unauthorized",
				message: "Machine not authorized. Contact administrator.",
			});
		}
	} catch (error) {
		console.error("Auth API Error:", error);
		// Fail open if Redis fails
		return res.status(200).json({
			status: "authorized",
			message: "Service unavailable, access granted",
		});
	}
}
