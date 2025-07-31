// pages/index.js
import { useState, useEffect } from "react";
import Head from "next/head";

export default function Home() {
	const [machines, setMachines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchMachines();
	}, []);

	const fetchMachines = async () => {
		try {
			const response = await fetch("/api/machines");
			const data = await response.json();
			setMachines(data.machines || []);
			setError("");
		} catch (err) {
			setError("Failed to load machines");
		} finally {
			setLoading(false);
		}
	};

	const toggleMachine = async (machineId, currentStatus) => {
		try {
			const response = await fetch("/api/machines", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ machineId, allowed: !currentStatus }),
			});
			if (response.ok) await fetchMachines();
		} catch (err) {
			setError("Failed to update machine");
		}
	};

	const deleteMachine = async (machineId) => {
		if (!confirm("Delete this machine?")) return;
		try {
			const response = await fetch("/api/machines", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ machineId }),
			});
			if (response.ok) await fetchMachines();
		} catch (err) {
			setError("Failed to delete machine");
		}
	};

	if (loading) return <div className="p-8 text-center">Loading...</div>;

	return (
		<div className="min-h-screen bg-gray-50">
			<Head>
				<title>Employee Console Auth</title>
			</Head>

			{/* Header */}
			<div className="bg-gray-900 text-white p-6 text-center">
				<h1 className="text-2xl font-bold">Employee Console</h1>
				<p className="text-gray-300">Machine Authorization</p>
			</div>

			<div className="max-w-4xl mx-auto p-6">
				{/* Error */}
				{error && <div className="bg-red-50 text-red-700 p-3 rounded mb-6 border border-red-200">{error}</div>}

				{/* Stats */}
				<div className="grid grid-cols-3 gap-4 mb-6">
					<div className="bg-white p-4 rounded shadow text-center">
						<div className="text-2xl font-bold">{machines.length}</div>
						<div className="text-sm text-gray-600">Total</div>
					</div>
					<div className="bg-white p-4 rounded shadow text-center">
						<div className="text-2xl font-bold text-green-600">{machines.filter((m) => m.allowed).length}</div>
						<div className="text-sm text-gray-600">Allowed</div>
					</div>
					<div className="bg-white p-4 rounded shadow text-center">
						<div className="text-2xl font-bold text-red-600">{machines.filter((m) => !m.allowed).length}</div>
						<div className="text-sm text-gray-600">Blocked</div>
					</div>
				</div>

				{/* Machines */}
				{machines.length === 0 ? (
					<div className="bg-white p-8 rounded shadow text-center text-gray-500">
						<p>No machines registered yet.</p>
						<p className="text-sm">Machines appear when they first connect.</p>
					</div>
				) : (
					<div className="space-y-3">
						{machines.map((machine) => (
							<div key={machine.id} className="bg-white p-4 rounded shadow">
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="font-medium">{machine.name}</div>
										<div className="text-sm text-gray-500 font-mono">{machine.id}</div>
										<div className="text-xs text-gray-400">
											Last seen: {new Date(machine.lastSeen).toLocaleString()}
										</div>
									</div>

									<div className="flex items-center space-x-3">
										{/* Status */}
										<span
											className={`px-2 py-1 rounded text-sm font-medium ${
												machine.allowed
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{machine.allowed ? "✓ Allowed" : "✗ Blocked"}
										</span>

										{/* Toggle Button */}
										<button
											onClick={() => toggleMachine(machine.id, machine.allowed)}
											className={`px-3 py-1 rounded text-sm font-medium text-white ${
												machine.allowed
													? "bg-red-500 hover:bg-red-600"
													: "bg-green-500 hover:bg-green-600"
											}`}
										>
											{machine.allowed ? "Block" : "Allow"}
										</button>

										{/* Delete Button */}
										<button
											onClick={() => deleteMachine(machine.id)}
											className="px-3 py-1 rounded text-sm font-medium text-white bg-gray-500 hover:bg-gray-600"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
