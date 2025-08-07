const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const unfluff = require("unfluff");

const filePath = path.join(process.cwd(), "data", "wishlist.json");

module.exports = async (req, res) => {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	const url = req.body?.url;
	if (!url || typeof url !== "string") {
		return res.status(400).json({ error: "Missing or invalid URL" });
	}

	let meta = {};
	try {
		const response = await fetch(url);
		const html = await response.text();
		meta = unfluff(html);
	} catch (err) {
		console.error("Metadata extraction failed:", err);
	}

	const item = {
		url,
		title: meta?.title || "Unknown",
		description: meta?.description || "",
		image: meta?.image || "",
		site: new URL(url).hostname,
		date: new Date().toISOString(),
	};

	let data = [];
	try {
		if (fs.existsSync(filePath)) {
			const raw = fs.readFileSync(filePath, "utf8");
			data = JSON.parse(raw);
		}
	} catch {
		data = [];
	}

	data.push(item);

	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	} catch (err) {
		return res.status(500).json({ error: "Failed to write data" });
	}

	res.status(200).json({ saved: true, item });
};