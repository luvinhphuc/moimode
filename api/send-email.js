import nodemailer from "nodemailer";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REQUEST_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1200;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function response(status, message, res) {
	return res.status(status).json({ success: status < 400, message });
}

function parseBody(body) {
	if (typeof body !== "string") return body;
	try {
		return JSON.parse(body);
	} catch {
		return null;
	}
}

function requestSize(req, body) {
	const contentLength = Number(req.headers?.["content-length"]);
	if (Number.isFinite(contentLength) && contentLength > 0) return contentLength;
	try {
		return Buffer.byteLength(typeof body === "string" ? body : JSON.stringify(body ?? {}));
	} catch {
		return 0;
	}
}

function escapeHtml(value) {
	return value.replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	})[character]);
}

export function validateSubmission(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { error: "Invalid request body." };
	}

	if (typeof payload.website !== "undefined" && typeof payload.website !== "string") {
		return { error: "Invalid request body." };
	}
	if (payload.website?.trim()) return { error: "Invalid request body." };

	const { name, email, story, personality, imageData } = payload;
	if ([name, email, story, personality, imageData].some((value) => typeof value !== "string" || !value.trim())) {
		return { error: "Please complete all required fields." };
	}

	const values = {
		name: name.trim(),
		email: email.trim(),
		story: story.trim(),
		personality: personality.trim(),
	};
	if (values.name.length > 80 || values.email.length > 254 || values.story.length > 1500 || values.personality.length > 100) {
		return { error: "Input exceeds the allowed length." };
	}
	if (!EMAIL_PATTERN.test(values.email)) return { error: "Enter a valid email address." };

	const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageData);
	if (!match || match[1].length % 4 !== 0) return { error: "The Crocs image is not a valid PNG." };
	if (match[1].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) {
		return { error: "The Crocs image must be under 2 MB." };
	}

	const imageBuffer = Buffer.from(match[1], "base64");
	if (imageBuffer.toString("base64") !== match[1] || imageBuffer.length < 24) {
		return { error: "The Crocs image is not a valid PNG." };
	}
	if (imageBuffer.length > MAX_IMAGE_BYTES) return { error: "The Crocs image must be under 2 MB." };
	if (!imageBuffer.subarray(0, 8).equals(PNG_SIGNATURE) || imageBuffer.toString("ascii", 12, 16) !== "IHDR") {
		return { error: "The Crocs image is not a valid PNG." };
	}

	const width = imageBuffer.readUInt32BE(16);
	const height = imageBuffer.readUInt32BE(20);
	if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
		return { error: "The Crocs image dimensions are not supported." };
	}

	return { values, imageBuffer };
}

// Keep deployment rate limits at Vercel Firewall/Turnstile so protection works across isolates.
export default async function handler(req, res, dependencies = {}) {
	if (req.method !== "POST") {
		res.setHeader?.("Allow", "POST");
		return response(405, "Method not allowed.", res);
	}

	const body = parseBody(req.body);
	if (requestSize(req, body) > MAX_REQUEST_BYTES) {
		return response(413, "The request is too large.", res);
	}

	const validation = validateSubmission(body);
	if (validation.error) return response(400, validation.error, res);

	const { SMTP_USER, SMTP_PASS, RECEIVER_EMAIL } = process.env;
	if (!SMTP_USER || !SMTP_PASS || !RECEIVER_EMAIL) {
		return response(500, "The email service is not configured.", res);
	}

	const { values, imageBuffer } = validation;
	const escapedName = escapeHtml(values.name);
	const escapedEmail = escapeHtml(values.email);
	const escapedPersonality = escapeHtml(values.personality);
	const escapedStory = escapeHtml(values.story);
	let transporter;
	try {
		const createTransport = dependencies.createTransport ?? nodemailer.createTransport;
		transporter = createTransport({
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: { user: SMTP_USER, pass: SMTP_PASS },
			connectionTimeout: 10000,
			greetingTimeout: 10000,
			socketTimeout: 20000,
		});
		const info = await transporter.sendMail({
			from: { name: "Móimode", address: SMTP_USER },
			to: RECEIVER_EMAIL,
			replyTo: values.email,
			subject: "Móimode — New Story Submission",
			text: [
				"New Móimode story submission",
				"",
				`Name: ${values.name}`,
				`Email: ${values.email}`,
				`Personality: ${values.personality}`,
				"",
				"Story:",
				values.story,
			].join("\n"),
			html: `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f1e8;color:#032b36;font-family:Arial,sans-serif">
<main style="max-width:680px;margin:0 auto;padding:28px;border:1px solid #d9d3c8;border-radius:16px;background:#fff">
<p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px">MÓIMODE / NEW STORY</p>
<h1 style="margin:0 0 24px;font-size:28px">A new story has arrived</h1>
<p><strong>Name</strong><br>${escapedName}</p>
<p><strong>Email</strong><br>${escapedEmail}</p>
<p><strong>Personality</strong><br>${escapedPersonality}</p>
<p><strong>Story</strong></p>
<p style="padding:16px;border-radius:10px;background:#f6f1e8;line-height:1.6;white-space:pre-wrap">${escapedStory}</p>
<p style="margin-top:24px;font-size:13px;color:#52656a">The customized Crocs PNG is attached as <strong>moimode-crocs.png</strong>.</p>
</main></body></html>`,
			attachments: [{
				filename: "moimode-crocs.png",
				content: imageBuffer,
				contentType: "image/png",
			}],
			disableFileAccess: true,
			disableUrlAccess: true,
		});

		if (!info.accepted?.length || info.rejected?.length) {
			const error = new Error("SMTP did not accept the message.");
			error.code = "EENVELOPE";
			throw error;
		}
		return response(200, "Story sent successfully.", res);
	} catch (error) {
		// Log transport diagnostics only; never log user content or the attachment.
		console.error("Móimode email submission failed.", error?.code ?? "unknown");
		return response(500, "Unable to send your story right now. Please try again.", res);
	} finally {
		transporter?.close?.();
	}
}
