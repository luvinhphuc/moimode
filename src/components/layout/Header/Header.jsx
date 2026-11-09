import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { ROUTE_PATHS } from "../../../config/routePaths.js";
import { gsap, ScrollTrigger, useGSAP } from "../../../utils/gsap.js";
import "./Header.css";


const Header = ({ onAction }) => {
	const headerRef = useRef(null);
	const { pathname } = useLocation();
	const isCustomizer = pathname === ROUTE_PATHS.customize;
	const actionLabel = isCustomizer ? "HOME" : "CUSTOMIZE";
	const actionPath = isCustomizer ? ROUTE_PATHS.home : ROUTE_PATHS.customize;

	useGSAP(
		() => {
			const header = headerRef.current;
			if (!header) return undefined;

			let lastScroll = window.scrollY;
			let isHidden = false;
			const setHidden = (nextHidden) => {
				if (nextHidden === isHidden) return;
				isHidden = nextHidden;
				gsap.to(header, {
					autoAlpha: nextHidden ? 0 : 1,
					duration: 0.32,
					ease: "power2.out",
					overwrite: true,
					yPercent: nextHidden ? -135 : 0,
				});
			};

			const directionTrigger = ScrollTrigger.create({
				end: "max",
				start: 0,
				onUpdate: () => {
					const nextScroll = window.scrollY;
					const delta = nextScroll - lastScroll;
					if (Math.abs(delta) < 8) return;

					setHidden(delta > 0 && nextScroll > 24);
					lastScroll = nextScroll;
				},
			});

			return () => directionTrigger.kill();
		},
		{ scope: headerRef },
	);

	return (
		<header ref={headerRef} className="site-header">
			<Link
				className="site-header__brand"
				to={ROUTE_PATHS.home}
				aria-label="MOIMODE home"
			>
				<img
					className="site-header__logo"
					src="/images/moimode-logo.svg"
					alt=""
				/>
			</Link>
			<Link
				className="site-header__action"
				to={actionPath}
				onClick={onAction}
			>
				{actionLabel}
			</Link>
		</header>
	);
};

export default Header;
