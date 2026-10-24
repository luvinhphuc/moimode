import { Link, useLocation } from "react-router-dom";

import { ROUTE_PATHS } from "../../../config/routePaths.js";
import "./Header.css";


const Header = ({ onAction }) => {
	const { pathname } = useLocation();
	const isCustomizer = pathname === ROUTE_PATHS.customize;
	const actionLabel = isCustomizer ? "HOME" : "CUSTOMIZE";
	const actionPath = isCustomizer ? ROUTE_PATHS.home : ROUTE_PATHS.customize;

	return (
		<header className="site-header">
			<Link
				className="site-header__brand"
				to={ROUTE_PATHS.home}
				aria-label="MOIMODE home"
			>
				MOIMODE
				<span>.</span>
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
