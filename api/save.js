const fs = require("fs");
const path = require("path");
const { extract } = require("@extractus/article-meta");

const filePath = path.join(process.cwd(), "data", "wishlist.json");

module.exports = async (req, res) => {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	// Parse URL from body
	const url = req.body?.url;
	if (!url || typeof url !== "string") {
		return res.status(400).json({ error: "Missing or invalid URL" });
	}

	// Scrape metadata
	let meta = {};
	try {
		meta = await extract(url);
	} catch {
		// Gracefully continue even if metadata scraping fails
	}

	const item = {
		url,
		title: meta?.title || "Unknown",
		description: meta?.description || "",
		image: meta?.image || "",
		site: new URL(url).hostname,
		date: new Date().toISOString(),
	};

	// Read existing data
	let data = [];
	try {
		if (fs.existsSync(filePath)) {
			const raw = fs.readFileSync(filePath, "utf8");
			data = JSON.parse(raw);
		}
	} catch {
		// If file is unreadable or invalid, fallback to empty array
		data = [];
	}

	data.push(item);

	// Write updated data back to file
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	} catch (err) {
		return res.status(500).json({ error: "Failed to write data" });
	}

	res.status(200).json({ saved: true, item });
};