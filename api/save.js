// api/save.js
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { url } = req.body;
	if (!url) {
		return res.status(400).json({ error: 'Missing URL in body' });
	}

	try {
		// 1. Fetch the page
		const response = await fetch(url);
		const html = await response.text();

		// 2. Parse metadata
		const root = parse(html);
		const title = root.querySelector('title')?.text || '';
		const description = root.querySelector('meta[name="description"]')?.getAttribute('content') || '';
		const image = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
		const site = new URL(url).hostname;

		const newEntry = {
			url,
			title,
			description,
			image,
			site,
			addedAt: new Date().toISOString()
		};

		// 3. Append to JSON file
		const filePath = path.join(process.cwd(), 'data/wishlist.json');
		const fileData = await fs.readFile(filePath, 'utf8');
		const wishlist = JSON.parse(fileData);
		wishlist.push(newEntry);
		await fs.writeFile(filePath, JSON.stringify(wishlist, null, 2));

		return res.status(200).json({ success: true, data: newEntry });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}