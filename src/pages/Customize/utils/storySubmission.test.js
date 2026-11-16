import assert from "node:assert/strict";
import test from "node:test";

import { countStoryWords, validateStoryDraft } from "./storySubmission.js";

const valid = { nickname: "Ari", email: "ari@example.com", story: "A little piece of me.", consent: true };

test("counts whitespace-separated words including Vietnamese text", () => {
	assert.equal(countStoryWords("  Câu chuyện của tôi\n thật vui  "), 6);
	assert.equal(countStoryWords("  \n  "), 0);
});

test("allows exactly 100 words and rejects 101", () => {
	assert.deepEqual(validateStoryDraft({ ...valid, story: Array(100).fill("word").join(" ") }), {});
	assert.equal(validateStoryDraft({ ...valid, story: Array(101).fill("word").join(" ") }).story, "Keep your story to 100 words or fewer.");
});

test("requires contact details, story, and active consent", () => {
	const errors = validateStoryDraft({ nickname: " ", email: "bad@email", story: " ", consent: false });
	assert.deepEqual(Object.keys(errors), ["nickname", "email", "story", "consent"]);
});
