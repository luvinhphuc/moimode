import { useId, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ROUTE_PATHS } from "../../../config/routePaths.js";
import useFooterJourney from "./useFooterJourney.js";
import "./Footer.css";

// Artwork from the supplied hand-drawn prototype, in the logo's yellow.
function StarArtwork() {
	return (
		<g transform="scale(0.11905) translate(-223.5 -227)" stroke="#151613" strokeLinecap="round" strokeLinejoin="round">
			<path d="M138 167 C146 131 159 82 180 80 C203 77 229 116 241 149 C268 136 312 124 330 132 C352 144 358 173 348 198 C339 221 316 236 300 246 C289 254 294 260 304 271 C321 290 337 321 329 344 C326 362 312 361 286 349 L210 308 C192 326 177 351 163 361 C146 374 125 371 111 369 C95 346 99 300 109 265 C81 260 45 244 40 226 C31 202 72 181 138 167 Z" fill="#fff000" strokeWidth="13" />
			<path d="M145 167L151 167 M81 102 Q85 109 90 110 M292 69 L299 64 M400 261 L413 260 M32 322 L39 315 M223 370 L227 389" fill="none" strokeWidth="9" />
		</g>
	);
}

function Footer({ pathnameOverride }) {
	const footerRef = useRef(null);
	const { pathname: routePathname } = useLocation();
	const pathname = pathnameOverride ?? routePathname;
	const isHome = pathname === ROUTE_PATHS.home;
	const id = useId().replace(/:/g, "");
	const starId = `footer-star-${id}`;
	const wordmarkClipId = `footer-wordmark-${id}`;
	const dustMaskId = `footer-dust-${id}`;
	useFooterJourney(footerRef, pathname);

	const backToTop = () => {
		const immediate = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const scrollEvent = new CustomEvent("site-scroll-to-top", {
			cancelable: true,
			detail: { immediate },
		});
		if (window.dispatchEvent(scrollEvent)) {
			window.scrollTo({ top: 0, left: 0, behavior: immediate ? "instant" : "smooth" });
		}
	};
	const visitSection = (event, section) => {
		if (pathname !== ROUTE_PATHS.home || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
		const target = document.getElementById(section);
		if (!target) return;
		event.preventDefault();
		target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
	};

	return (
		<footer ref={footerRef} className={`site-footer${isHome ? "" : " site-footer--compact"}`} aria-label="MOIMODE footer">
			{isHome && <div className="site-footer__top">
				<span className="site-footer__opening-label">THE END? NOT REALLY.</span>
				<span className="site-footer__closing-label">KEEP WALKING YOUR OWN WAY. <span className="site-footer__closing-icon" aria-hidden="true">✦</span></span>
			</div>}
			{isHome && <div className="site-footer__hero" data-footer-hero="">
				<div className="site-footer__copy" data-footer-copy="" data-footer-dust-exclusion="">
					<p className="site-footer__eyebrow">ONE LAST STEP.</p>
					<h2 className="site-footer__title">See you on<br />your next step.</h2>
					<p className="site-footer__description">Different paths. Different stories. Always yours.</p>
				</div>
			</div>}
			<div className="site-footer__bottom">
				<Link className="site-footer__brand" to={ROUTE_PATHS.home} aria-label="MOIMODE home" onClick={pathname === ROUTE_PATHS.home ? (event) => { event.preventDefault(); backToTop(); } : undefined}>
					<svg className="site-footer__wordmark" viewBox="0 0 1468 315" aria-hidden="true">
						<defs><clipPath id={wordmarkClipId}><rect width="1216" height="315" /></clipPath></defs>
						<image href="/images/moimode-logo.svg" width="1468" height="315" clipPath={`url(#${wordmarkClipId})`} />
					</svg>
					<svg className="site-footer__logo-star" data-footer-logo-star="" viewBox="-25 -25 50 50" aria-hidden="true">
						<use href={`#${starId}`} />
					</svg>
				</Link>
				<nav className="site-footer__links" aria-label="Footer navigation" data-footer-dust-exclusion="">
					<Link className="site-footer__link" to={`${ROUTE_PATHS.home}#about`} onClick={(event) => visitSection(event, "about")}>About</Link>
					<Link className="site-footer__link" to={`${ROUTE_PATHS.home}#gallery`} onClick={(event) => visitSection(event, "gallery")}>Community</Link>
					<Link className="site-footer__link" to={ROUTE_PATHS.customize}>Customize <span className="site-footer__link-icon" aria-hidden="true">↗</span></Link>
				</nav>
				<button className="site-footer__back" type="button" onClick={backToTop} data-footer-dust-exclusion="">
					<span className="site-footer__back-label">Back to top</span>
					<span className="site-footer__back-icon" aria-hidden="true"><ArrowUp size={19} strokeWidth={2.4} /></span>
				</button>
				<div className="site-footer__legal" data-footer-dust-exclusion="">
					<span className="site-footer__copyright">© 2026 MOIMODE · Independent youth advocacy project.</span>
					<Link className="site-footer__policy-link" to={ROUTE_PATHS.policies}>Policies · Privacy &amp; sharing</Link>
					<span className="site-footer__disclaimer">Not sponsored or endorsed by Crocs.</span>
				</div>
			</div>
			<svg className="site-footer__flight" data-footer-flight="" aria-hidden="true" focusable="false">
				<defs>
					<g id={starId}><StarArtwork /></g>
					<mask id={dustMaskId} maskUnits="userSpaceOnUse">
						<rect data-footer-mask-base="" fill="white" />
						<g data-footer-mask-exclusions="" />
					</mask>
				</defs>
				<g data-footer-dust="" mask={`url(#${dustMaskId})`} />
				<g data-footer-moving-star="" opacity="0"><use href={`#${starId}`} /></g>
			</svg>
		</footer>
	);
}

export default Footer;
