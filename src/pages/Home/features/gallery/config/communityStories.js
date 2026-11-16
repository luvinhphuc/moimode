/**
 * Thêm/sửa story tại đây; thứ tự trong mảng là thứ tự hiển thị.
 * Copy một item bên dưới, giữ id và đường dẫn image không trùng item khác.
 * Ảnh: public/images/gallery/ten-anh.jpg → image: "/images/gallery/ten-anh.jpg".
 * title có thể bỏ qua; story khoảng tối đa 100 từ. Dùng \n\n để xuống đoạn.
 * isDemo: false cho story thật; true cho nội dung demo.
 *
 * @typedef {{id: string, nickname: string, personality: string, title?: string, story: string, image: string, isDemo: boolean}} CommunityStory
 */

/** @type {ReadonlyArray<CommunityStory>} */
export const communityStories = Object.freeze([].map(Object.freeze));
