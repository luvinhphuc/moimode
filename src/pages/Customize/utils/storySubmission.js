export function countStoryWords(value) {
	const words = value.trim().match(/\S+/gu);
	return words?.length ?? 0;
}

export function validateStoryDraft({ nickname, email, story, consent }) {
	const errors = {};
	if (!nickname.trim()) errors.nickname = "Please add your name or nickname.";
	if (!email.trim()) errors.email = "Please add your email address.";
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
	if (!story.trim()) errors.story = "Please tell us your story.";
	else if (countStoryWords(story) > 100) errors.story = "Keep your story to 100 words or fewer.";
	if (!consent) errors.consent = "Please agree before continuing to preview.";
	return errors;
}
