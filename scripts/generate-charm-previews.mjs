import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { tmpdir } from "node:os";

const root = process.cwd();
const outputDir = path.join(root, "public", "model", "charms", "previews");
const chromePath =
	process.env.CHROME_PATH ??
	"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viteUrl = "http://127.0.0.1:4173/charm-preview-generator.html";
const useExternalBrowser = process.env.PREVIEW_BROWSER === "external";
const chromeProfileDir = await mkdtemp(path.join(tmpdir(), "moimode-charm-preview-"));

const charmIds = [
	"an-gi-chua",
	"banh-mi",
	"bubble-tea",
	"chill-phet",
	"cloud",
	"conical-hat",
	"di-dau-day",
	"dragon-fruit",
	"helmet",
	"het-nuoc-cham",
	"lightning",
	"lotus",
	"lucky-cat",
	"red-stool",
	"retro-phone",
	"smiley-vietnam",
	"flower",
];

await mkdir(outputDir, { recursive: true });

const saveServer = createServer(async (request, response) => {
	response.setHeader("Access-Control-Allow-Origin", "*");

	if (request.method !== "POST" || !request.url?.startsWith("/save?")) {
		response.writeHead(404);
		response.end();
		return;
	}

	const id = new URL(request.url, "http://127.0.0.1:4174").searchParams.get("id");
	if (!id || !/^[a-z0-9-]+$/.test(id)) {
		response.writeHead(400);
		response.end("Invalid charm id");
		return;
	}

	const chunks = [];
	for await (const chunk of request) chunks.push(chunk);
	const payload = Buffer.concat(chunks).toString("utf8");
	const base64 = payload.replace(/^data:image\/png;base64,/, "");
	await writeFile(path.join(outputDir, `${id}.png`), Buffer.from(base64, "base64"));
	response.writeHead(204);
	response.end();
});

await new Promise((resolve) => saveServer.listen(4174, "127.0.0.1", resolve));

const vite = spawn(
	process.execPath,
	[path.join(root, "node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", "4173"],
	{ cwd: root, stdio: "ignore" },
);

try {
	await waitForUrl(viteUrl);
	if (useExternalBrowser) {
		for (const charmId of charmIds) {
			await rm(path.join(outputDir, `${charmId}.png`), { force: true });
		}
		console.log(`Open ${viteUrl}?id=all in a WebGL-enabled browser.`);
		await waitForAllFiles();
	} else {
		for (const charmId of charmIds) {
			const outputPath = path.join(outputDir, `${charmId}.png`);
			await rm(outputPath, { force: true });
			await renderCharm(charmId);
			await waitForFile(outputPath);
			console.log(`Generated ${path.relative(root, outputPath)}`);
		}
	}
} finally {
	vite.kill();
	saveServer.close();
	await rm(chromeProfileDir, { recursive: true, force: true });
}

async function waitForUrl(url) {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			const response = await fetch(url);
			if (response.ok) return;
		} catch {}
		await delay(250);
	}
	throw new Error(`Vite did not start at ${url}`);
}

async function waitForFile(filePath) {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			const file = await stat(filePath);
			if (file.size > 100) return;
		} catch {}
		await delay(250);
	}
	throw new Error(`Preview was not generated: ${filePath}`);
}

async function waitForAllFiles() {
	for (let attempt = 0; attempt < 600; attempt += 1) {
		const filesReady = await Promise.all(
			charmIds.map(async (charmId) => {
				try {
					return (await stat(path.join(outputDir, `${charmId}.png`))).size > 100;
				} catch {
					return false;
				}
			}),
		);
		if (filesReady.every(Boolean)) return;
		await delay(500);
	}
	throw new Error("Not all charm previews were generated.");
}

function renderCharm(charmId) {
	return new Promise((resolve, reject) => {
		const chrome = spawn(
			chromePath,
			[
				"--headless=new",
				"--no-first-run",
				"--no-default-browser-check",
				"--disable-gpu",
				"--use-gl=swiftshader",
				"--enable-unsafe-swiftshader",
				`--user-data-dir=${chromeProfileDir}`,
				"--virtual-time-budget=8000",
				"--dump-dom",
				`${viteUrl}?id=${encodeURIComponent(charmId)}`,
			],
			{ stdio: "ignore" },
		);

		chrome.once("error", reject);
		chrome.once("exit", (code) => {
			if (code === 0) resolve();
			else reject(new Error(`Chrome failed for ${charmId} with code ${code}`));
		});
	});
}

function delay(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
