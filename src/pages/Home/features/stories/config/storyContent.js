// Demo stories, not testimonials from the people in the stock photographs.
// Add a record here to add a card. images accepts one primary image and an
// optional second image; mobile only requests the primary image.
export const STORY_ITEMS = Object.freeze([
	{
		id: "a-little-more-colour",
		username: "@a.little.more.colour",
		story: "I used to save my favourite colours for special occasions. Now, a regular Tuesday is reason enough. A little green, a little pink, and something unexpected — getting dressed has become my favourite way to say hello to the day.",
		images: [
			{
				src: "/images/stories/colour-01.jpg",
				alt: "A colourful outfit and green beret against a weathered red door",
				sourceUrl: "https://www.pexels.com/photo/4269555/",
				credit: "Spencer Cooper / Pexels",
			},
			{
				src: "/images/stories/colour-02.jpg",
				alt: "The same colourful outfit, sitting cross-legged in green trousers",
				sourceUrl: "https://www.pexels.com/photo/4269557/",
				credit: "Spencer Cooper / Pexels",
			},
		],
	},
	{
		id: "my-own-rhythm",
		username: "@my.own.rhythm",
		story: "My style changes with the music in my headphones. Some days it is all about the details; other days, I just follow a feeling. I like knowing that I can show up a little differently and still feel completely like myself.",
		images: [
			{
				src: "/images/stories/street-01.jpg",
				alt: "A street-style portrait with braids and gold accessories",
				sourceUrl: "https://www.pexels.com/photo/16983327/",
				credit: "Reign Martinez / Pexels",
			},
			{
				src: "/images/stories/street-02.jpg",
				alt: "A second pose in the same outfit beside a sticker-covered doorway",
				sourceUrl: "https://www.pexels.com/photo/16983326/",
				credit: "Reign Martinez / Pexels",
			},
		],
	},
	{
		id: "wear-your-mood",
		username: "@wear.your.mood",
		story: "Mixing prints makes me happy. There is no big formula — I start with one thing I love and see where it takes me. The best outfits are the ones that make me forget to wonder what everyone else thinks.",
		images: [
			{
				src: "/images/stories/own-way.jpg",
				alt: "A bold, multicoloured matching outfit on a city street",
				sourceUrl: "https://www.pexels.com/photo/20554963/",
				credit: "William Adams / Pexels",
			},
		],
	},
]);
