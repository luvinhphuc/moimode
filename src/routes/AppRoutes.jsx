import { lazy, Suspense, useLayoutEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Footer from "../components/layout/Footer/Footer.jsx";
import Home from "../pages/Home/Home.jsx";
import { ROUTE_PATHS } from "../config/routePaths.js";

const Customize = lazy(() => import("../pages/Customize/Customize.jsx"));
const Policies = lazy(() => import("../pages/Policies/Policies.jsx"));

function ScrollToTop({ location }) {
	const { pathname, hash } = location;

	useLayoutEffect(() => {
		if (!hash) {
			window.scrollTo({ top: 0, behavior: "instant" });
			return undefined;
		}
		let frame;
		let alive = true;
		// Wait for Home's scroll setup and font layout when arriving from another route.
		document.fonts.ready.then(() => {
			if (!alive) return;
			frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "instant" }));
			});
		});
		return () => { alive = false; cancelAnimationFrame(frame); };
	}, [pathname, hash]);

	return null;
}

function AppRoutes({ location }) {
	const { pathname } = location;
	const fallback = pathname === ROUTE_PATHS.policies ? <p className="px-6 py-24">Loading policies…</p> : null;

	return (
		<Suspense fallback={fallback}>
			<ScrollToTop location={location} />
			<Routes location={location}>
				<Route path={ROUTE_PATHS.home} element={<Home />} />
				<Route path={ROUTE_PATHS.customize} element={<Customize />} />
				<Route path={ROUTE_PATHS.policies} element={<Policies />} />
				<Route path="*" element={<Navigate to={ROUTE_PATHS.home} replace />} />
			</Routes>
			<Footer pathnameOverride={pathname} />
		</Suspense>
	);
}

export default AppRoutes;
