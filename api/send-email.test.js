import assert from "node:assert/strict";
import test from "node:test";

import handler from "./send-email.js";
import { validateSubmission } from "./send-email.js";

const pngHeader = Buffer.alloc(24);
Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(pngHeader, 0);
pngHeader.writeUInt32BE(13, 8);
pngHeader.write("IHDR", 12, "ascii");
pngHeader.writeUInt32BE(1200, 16);
pngHeader.writeUInt32BE(1200, 20);

const validPayload = {
	name: "Alex",
	email: "alex@example.com",
	story: "My story.",
	personality: "The Playful Spirit",
	imageData: `data:image/png;base64,${pngHeader.toString("base64")}`,
};

async function invoke(method, body, dependencies = {}, headers = {}) {
	const res = {
		statusCode: 200,
		headers: {},
		setHeader(name, value) { this.headers[name] = value; },
		status(code) { this.statusCode = code; return this; },
		json(value) { this.body = value; return this; },
	};
	await handler({ method, body, headers }, res, dependencies);
	return res;
}

async function withEmailEnvironment(callback) {
	const names = ["SMTP_USER", "SMTP_PASS", "RECEIVER_EMAIL"];
	const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
	process.env.SMTP_USER = "sender@example.com";
	process.env.SMTP_PASS = "test-only-password";
	process.env.RECEIVER_EMAIL = "inbox@example.com";
	try {
		return await callback();
	} finally {
		for (const name of names) {
			if (previous[name] === undefined) delete process.env[name];
			else process.env[name] = previous[name];
		}
	}
}

test("GET returns 405 and allows POST only", async () => {
	const result = await invoke("GET", null);
	assert.equal(result.statusCode, 405);
	assert.equal(result.headers.Allow, "POST");
});

test("POST with missing fields returns 400", async () => {
	const result = await invoke("POST", {});
	assert.equal(result.statusCode, 400);
	assert.equal(result.body.success, false);
});

test("POST with malformed JSON returns 400", async () => {
	const result = await invoke("POST", "{not-json");
	assert.equal(result.statusCode, 400);
});

test("rejects an invalid email address", () => {
	assert.match(validateSubmission({ ...validPayload, email: "bad-email" }).error, /valid email/i);
});

test("rejects invalid PNG data URLs and signatures", () => {
	assert.match(validateSubmission({ ...validPayload, imageData: "data:image/jpeg;base64,AAAA" }).error, /valid PNG/i);
	assert.match(validateSubmission({ ...validPayload, imageData: "data:image/png;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }).error, /valid PNG/i);
});

test("rejects an oversized image and oversized request", async () => {
	const oversized = `data:image/png;base64,${"A".repeat(2_800_004)}`;
	assert.match(validateSubmission({ ...validPayload, imageData: oversized }).error, /under 2 MB/i);
	const request = await invoke("POST", validPayload, {}, { "content-length": String(3 * 1024 * 1024 + 1) });
	assert.equal(request.statusCode, 413);
});

test("rejects filled honeypot fields", () => {
	assert.match(validateSubmission({ ...validPayload, website: "spam" }).error, /invalid request/i);
});

test("sends escaped story data to the fixed inbox with a PNG attachment", async () => {
	await withEmailEnvironment(async () => {
		let mail;
		let transportOptions;
		let closed = false;
		const result = await invoke("POST", {
			...validPayload,
			story: "<img src=x onerror=alert(1)>\nA story",
			recipient: "attacker@example.com",
		}, {
			createTransport(options) {
				transportOptions = options;
				return {
					async sendMail(message) {
						mail = message;
						return { accepted: ["inbox@example.com"], rejected: [] };
					},
					close() { closed = true; },
				};
			},
		});

		assert.equal(result.statusCode, 200);
		assert.equal(result.body.success, true);
		assert.equal(transportOptions.host, "smtp.gmail.com");
		assert.equal(transportOptions.port, 465);
		assert.equal(transportOptions.secure, true);
		assert.equal(mail.to, "inbox@example.com");
		assert.equal(mail.replyTo, "alex@example.com");
		assert.equal(mail.attachments[0].filename, "moimode-crocs.png");
		assert.equal(mail.attachments[0].contentType, "image/png");
		assert.equal(mail.attachments[0].content.toString("base64"), pngHeader.toString("base64"));
		assert.match(mail.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
		assert.ok(closed);
	});
});

test("SMTP failures return a safe error without exposing transport details", async () => {
	await withEmailEnvironment(async () => {
		const originalConsoleError = console.error;
		const logs = [];
		console.error = (...values) => logs.push(values);
		try {
			const result = await invoke("POST", validPayload, {
				createTransport: () => ({
					async sendMail() {
						const error = new Error("private transport detail");
						error.code = "EAUTH";
						throw error;
					},
					close() {},
				}),
			});
			assert.equal(result.statusCode, 500);
			assert.equal(result.body.message, "Unable to send your story right now. Please try again.");
			assert.deepEqual(logs, [["Móimode email submission failed.", "EAUTH"]]);
		} finally {
			console.error = originalConsoleError;
		}
	});
});

test("SMTP rejection is not reported as a successful submission", async () => {
	await withEmailEnvironment(async () => {
		const originalConsoleError = console.error;
		console.error = () => {};
		try {
			const result = await invoke("POST", validPayload, {
				createTransport: () => ({
					async sendMail() { return { accepted: [], rejected: ["inbox@example.com"] }; },
					close() {},
				}),
			});
			assert.equal(result.statusCode, 500);
			assert.equal(result.body.success, false);
		} finally {
			console.error = originalConsoleError;
		}
	});
});
