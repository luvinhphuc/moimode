/**
 * Original logo artwork, cropped from the embedded PNG in the site's logo SVG.
 * (x: 1227, y: 17, 196 × 181), with only the surrounding dark matte removed.
 * Keep the source silhouette, proportions and white highlights; do not redraw.
 */
export default function BrandStar({ className, ...props }) {
	return <img src="/images/moimode-brand-star.png" width="196" height="181" alt="" aria-hidden="true" draggable="false" className={className} {...props} />;
}
