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
	const key = "machines";

	try {
		// if (req.method === "GET") {
		// 	const data = await getMachines();
		// 	return res.status(200).json(data);
		// }
		if (req.method === "GET") {
			const machines = (await redis.get(key)) || [];
			return res.status(200).json(machines);
		}

		const { machineId, name, allowed } = req.body;
		if (!machineId) {
			return res.status(400).json({ error: "Machine ID is required" });
		}

		const data = await getMachines();
		const index = data.machines.findIndex((m) => m.id === machineId);

		if (req.method === "POST") {
			const machine = {
				id: machineId,
				name: name || `Machine ${machineId.substring(0, 8)}`,
				allowed: allowed ?? false,
				lastSeen: new Date().toISOString(),
				dateAdded: index === -1 ? new Date().toISOString() : data.machines[index].dateAdded,
			};

			if (index === -1) {
				data.machines.push(machine);
			} else {
				data.machines[index] = machine;
			}

			await setMachines(data);
			return res.status(200).json({ success: true, machine });
		}

		if (req.method === "PUT") {
			if (allowed === undefined) {
				return res.status(400).json({ error: "Allowed status is required" });
			}
			if (index === -1) {
				return res.status(404).json({ error: "Machine not found" });
			}

			data.machines[index].allowed = allowed;
			data.machines[index].lastSeen = new Date().toISOString();

			await setMachines(data);
			return res.status(200).json({ success: true, machine: data.machines[index] });
		}

		if (req.method === "DELETE") {
			const initialLength = data.machines.length;
			data.machines = data.machines.filter((m) => m.id !== machineId);

			if (data.machines.length === initialLength) {
				return res.status(404).json({ error: "Machine not found" });
			}

			await setMachines(data);
			return res.status(200).json({ success: true });
		}

		res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
		return res.status(405).end(`Method ${req.method} Not Allowed`);
	} catch (error) {
		console.error("API Error:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
