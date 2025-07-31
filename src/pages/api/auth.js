// pages/api/auth.js
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "machines.json");

function readMachines() {
	try {
		if (!fs.existsSync(DATA_FILE)) {
			return { machines: [] };
		}
		const data = fs.readFileSync(DATA_FILE, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading machines:", error);
		return { machines: [] };
	}
}

function writeMachines(data) {
	try {
		const dataDir = path.dirname(DATA_FILE);
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}
		fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error("Error writing machines:", error);
	}
}

export default function handler(req, res) {
	// Only allow GET requests from Python app
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { machineId } = req.query;
	const {companyName} = req.query;

	if (!machineId) {
		return res.status(401).json({ error: "Machine ID is required" });
	}

	let company = machineId
	if (companyName){
		company = companyName
		console.info("Company name recorded", company)
	}


	try {
		const data = readMachines();
		let machine = data.machines.find((m) => m.id === machineId);

		// If machine doesn't exist, auto-register it as pending (not allowed)
		if (!machine) {
			console.log(`New machine attempting access: ${machineId}`);

			machine = {
				id: machineId,
				name: `Machine ${machineId.substring(0, 8)}: (${company})`,
				allowed: false, // New machines start as not allowed
				lastSeen: new Date().toISOString(),
				dateAdded: new Date().toISOString(),
			};

			data.machines.push(machine);
			writeMachines(data);

			// Return 401 for new machines
			return res.status(401).json({
				status: "unauthorized",
				message: "Machine not authorized. Contact administrator.",
			});
		}

		// Update last seen timestamp
		machine.lastSeen = new Date().toISOString();
		const machineIndex = data.machines.findIndex((m) => m.id === machineId);
		data.machines[machineIndex] = machine;
		writeMachines(data);

		// Return status based on allowed flag
		if (machine.allowed) {
			res.status(200).json({
				status: "authorized",
				message: "Access granted",
			});
		} else {
			res.status(401).json({
				status: "unauthorized",
				message: "Machine not authorized. Contact administrator.",
			});
		}
	} catch (error) {
		console.error("Auth API Error:", error);
		// On error, allow access (fail open)
		res.status(200).json({
			status: "authorized",
			message: "Service unavailable, access granted",
		});
	}
}
