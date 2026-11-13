// Demo stories, not testimonials from the people in the stock photographs.
// Add a record here to add a card. images accepts one primary image and an
// optional second image; mobile only requests the primary image.
export const STORY_ITEMS = Object.freeze([
    {
        id: 'khoanguyeno',
        username: '@khoanguyeno',
        story: 'From catching flights to wandering through my favourite bookstores, my Crocs are always part of the journey. Comfortable, versatile, and easy to style - they go wherever my curiosity takes me.',
        images: [
            {
                src: '/images/stories/khoanguyeno-1.jpg',
                alt: 'A young man with a shoulder bag inside a bookstore lined with shelves.',
            },
            {
                src: '/images/stories/khoanguyeno-2.jpg',
                alt: 'A traveler pulling a suitcase through a bright airport terminal.',
            },
        ],
    },
    {
        id: 'ngockhanh',
        username: '@Ngoc Khanh',
        story: `Who says dresses and Crocs don't go together? I love mixing feminine outfits with a casual, playful touch. Even on a simple grocery run, my Crocs let me stay comfortable while expressing my personal style`,
        images: [
            {
                src: '/images/stories/ngockhanh-1.jpg',
                alt: 'A woman browsing products in a brightly lit grocery store aisle.',
            },
            {
                src: '/images/stories/ngockhanh-2.jpg',
                alt: 'A woman in a black outfit posing at the entrance of a colorful shop.',
            },
        ],
    },
    {
        id: 'khoanguyeno-hanbok',
        username: '@khoanguyeno',
        story: 'Some journeys are about discovering new cultures and embracing different traditions. Wearing hanbok while exploring Korea, I let my personal style become part of the experience. Even in a traditional setting, my Crocs add a little touch of who I am.)',
        images: [
            {
                src: '/images/stories/khoanguyeno-hanbok.jpg',
                alt: 'A young man in a navy hanbok standing beside a traditional Korean palace wall.',
            },
        ],
    },
]);
