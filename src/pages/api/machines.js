// pages/api/machines.js
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "machines.json");

// Ensure data directory and file exist
function ensureDataFile() {
	const dataDir = path.dirname(DATA_FILE);

	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}

	if (!fs.existsSync(DATA_FILE)) {
		fs.writeFileSync(DATA_FILE, JSON.stringify({ machines: [] }, null, 2));
	}
}

function readMachines() {
	ensureDataFile();
	const data = fs.readFileSync(DATA_FILE, "utf8");
	return JSON.parse(data);
}

function writeMachines(data) {
	ensureDataFile();
	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
	try {
		if (req.method === "GET") {
			// Get all machines for admin interface
			const data = readMachines();
			res.status(200).json(data);
		} else if (req.method === "POST") {
			// Add new machine or update existing
			const { machineId, name, allowed = true } = req.body;

			if (!machineId) {
				return res.status(400).json({ error: "Machine ID is required" });
			}

			const data = readMachines();
			const existingIndex = data.machines.findIndex((m) => m.id === machineId);

			const machine = {
				id: machineId,
				name: name || `Machine ${machineId.substring(0, 8)}`,
				allowed,
				lastSeen: new Date().toISOString(),
				dateAdded: existingIndex === -1 ? new Date().toISOString() : data.machines[existingIndex].dateAdded,
			};

			if (existingIndex === -1) {
				data.machines.push(machine);
			} else {
				data.machines[existingIndex] = machine;
			}

			writeMachines(data);
			res.status(200).json({ success: true, machine });
		} else if (req.method === "PUT") {
			// Update machine status
			const { machineId, allowed } = req.body;

			if (!machineId || allowed === undefined) {
				return res.status(400).json({ error: "Machine ID and allowed status are required" });
			}

			const data = readMachines();
			const machineIndex = data.machines.findIndex((m) => m.id === machineId);

			if (machineIndex === -1) {
				return res.status(404).json({ error: "Machine not found" });
			}

			data.machines[machineIndex].allowed = allowed;
			data.machines[machineIndex].lastSeen = new Date().toISOString();

			writeMachines(data);
			res.status(200).json({ success: true, machine: data.machines[machineIndex] });
		} else if (req.method === "DELETE") {
			// Delete machine
			const { machineId } = req.body;

			if (!machineId) {
				return res.status(400).json({ error: "Machine ID is required" });
			}

			const data = readMachines();
			const initialLength = data.machines.length;
			data.machines = data.machines.filter((m) => m.id !== machineId);

			if (data.machines.length === initialLength) {
				return res.status(404).json({ error: "Machine not found" });
			}

			writeMachines(data);
			res.status(200).json({ success: true });
		} else {
			res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
			res.status(405).end(`Method ${req.method} Not Allowed`);
		}
	} catch (error) {
		console.error("API Error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
