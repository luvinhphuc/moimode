import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";

import { ROUTE_PATHS } from "../../../config/routePaths.js";
import { gsap, ScrollTrigger } from "../../../utils/gsap.js";
import "./Header.css";

const primaryLinks = [
  ["Home", "/", "home"],
  ["About", "/#about", "about"],
  ["Customize", ROUTE_PATHS.customize, "customize"],
  ["Stories", "/#the-story-behind", "the-story-behind"],
];
const secondaryLinks = [
  ["Our People", "/#our-people", "our-people"],
  ["Community", "/#gallery", "gallery"],
  ["Policies", ROUTE_PATHS.policies, "policies"],
];
const sections = [
  ["home", ".hero-transition-track"],
  ["about", "#about"],
  ["our-people", "#our-people"],
  ["the-story-behind", "#the-story-behind"],
  ["gallery", "#gallery"],
  ["footer", ".site-footer"],
];

function readTheme(pathname) {
  const styles = getComputedStyle(document.documentElement);
  const palette = (name) => styles.getPropertyValue("--color-moi-" + name).trim();
  if (pathname === ROUTE_PATHS.customize) return { key: "customize", background: palette("bg"), dark: false };
  if (pathname === ROUTE_PATHS.policies) return { key: "policies", background: palette("powder"), dark: false };
  const point = innerHeight * 0.34;
  const active = sections.map(([key, selector]) => ({ key, node: document.querySelector(selector) })).filter(({ node }) => {
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    return rect.top <= point && rect.bottom > point;
  }).at(-1);
  const key = active?.key || "home";
  const surface = key === "about" ? document.querySelector(".about-stage") : active?.node;
  const measured = surface && getComputedStyle(surface).backgroundColor;
  const fallback = { home: palette("bg"), about: palette("bg"), "our-people": "#ffffff", "the-story-behind": palette("sky"), gallery: palette("bg"), footer: palette("footer") };
  const background = measured && measured !== "rgba(0, 0, 0, 0)" ? measured : fallback[key];
  const [r, g, b] = gsap.utils.splitColor(background);
  return { key, background, dark: (r * 299 + g * 587 + b * 114) / 1000 < 128 };
}

export default function HeaderMenu({ onAction }) {
  const { pathname } = useLocation();
  const root = useRef(null);
  const header = useRef(null);
  const panel = useRef(null);
  const scrim = useRef(null);
  const linkList = useRef(null);
  const menuIcon = useRef(null);
  const iconMotion = useRef(null);
  const motions = useRef([]);
  const drag = useRef(null);
  const hasOpened = useRef(false);
  const isOpen = useRef(false);
  const lastTheme = useRef("");
  const [open, setOpen] = useState(false);
  const [lightInk, setLightInk] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const navRoot = root.current;
    let frame = 0;
    const update = () => {
      frame = 0;
      const theme = readTheme(pathname);
      const signature = theme.key + theme.background + theme.dark;
      if (signature === lastTheme.current || !root.current) return;
      lastTheme.current = signature;
      setLightInk(theme.dark);
      setActiveSection(theme.key);
      const ink = getComputedStyle(document.documentElement).getPropertyValue(theme.dark ? "--color-moi-bg" : "--color-moi-ink").trim();
      gsap.to(root.current, { "--nav-ink": ink, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.38, ease: "power2.out", overwrite: "auto" });
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    ScrollTrigger.addEventListener("refresh", queue);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
      ScrollTrigger.removeEventListener("refresh", queue);
      gsap.killTweensOf(navRoot);
    };
  }, [pathname]);

  useEffect(() => {
    const navHeader = header.current;
    let previous = scrollY;
    let hidden = false;
    const trigger = ScrollTrigger.create({ start: 0, end: "max", onUpdate: () => {
      if (isOpen.current) return;
      const next = scrollY;
      const delta = next - previous;
      previous = next;
      if (Math.abs(delta) < 8) return;
      const shouldHide = delta > 0 && next > 24;
      if (hidden === shouldHide) return;
      hidden = shouldHide;
      gsap.to(header.current, { autoAlpha: hidden ? 0 : 1, yPercent: hidden ? -135 : 0, duration: 0.32, ease: "power2.out", overwrite: true });
    } });
    return () => { trigger.kill(); gsap.killTweensOf(navHeader); };
  }, []);

  useLayoutEffect(() => {
    const icon = menuIcon.current;
    if (!icon) return;
    const top = icon.querySelector(".site-header__menu-line--top");
    const middle = icon.querySelector(".site-header__menu-line--middle");
    const bottom = icon.querySelector(".site-header__menu-line--bottom");
    gsap.set(top, { y: -7, transformOrigin: "50% 50%" });
    gsap.set(bottom, { y: 7, transformOrigin: "50% 50%" });
    const timeline = gsap.timeline({ paused: true, defaults: { duration: 0.34, ease: "power3.inOut" } })
      .to(top, { y: 0, rotation: 45 }, 0)
      .to(middle, { scaleX: 0, autoAlpha: 0, duration: 0.17 }, 0)
      .to(bottom, { y: 0, rotation: -45 }, 0);
    iconMotion.current = timeline;
    return () => timeline.kill();
  }, []);

  useLayoutEffect(() => {
    const timeline = iconMotion.current;
    if (!timeline) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) timeline.progress(open ? 1 : 0);
    else if (open) timeline.play();
    else timeline.reverse();
  }, [open]);

  useLayoutEffect(() => {
    const drawer = panel.current;
    const backdrop = scrim.current;
    const items = linkList.current?.querySelectorAll(".site-menu__link");
    if (!drawer || !backdrop || !items) return;
    isOpen.current = open;
    if (!hasOpened.current && !open) {
      gsap.set(drawer, { yPercent: 105, visibility: "hidden" });
      return;
    }
    if (open) hasOpened.current = true;
    motions.current.forEach((motion) => motion.kill());
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      drawer.inert = false;
      gsap.set(drawer, { visibility: "visible" });
      gsap.set(backdrop, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(items, { yPercent: 115, autoAlpha: 0 });
      motions.current = [
        gsap.to(drawer, { yPercent: 0, duration: 0.72, ease: "power3.out" }),
        gsap.to(backdrop, { autoAlpha: 1, backdropFilter: "blur(13px)", duration: 0.45 }),
        gsap.to(items, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out", delay: 0.12, stagger: 0.065 }),
      ];
    } else {
      motions.current = [
        gsap.to(drawer, { y: 0, yPercent: 105, duration: 0.5, ease: "power3.inOut", onComplete: () => {
          if (!isOpen.current) { drawer.inert = true; gsap.set(drawer, { visibility: "hidden" }); }
        } }),
        gsap.to(backdrop, { autoAlpha: 0, backdropFilter: "blur(0px)", pointerEvents: "none", duration: 0.45 }),
        gsap.to(items, { yPercent: 115, autoAlpha: 0, duration: 0.22, stagger: 0.025 }),
      ];
    }
    if (reduced) motions.current.forEach((motion) => motion.progress(1));
    return () => motions.current.forEach((motion) => motion.kill());
  }, [open]);
  useEffect(() => {
    isOpen.current = open;
    if (open) {
      gsap.to(header.current, { autoAlpha: 1, yPercent: 0, duration: 0.2, overwrite: true });
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (event) => {
        if (event.key === "Escape") { setOpen(false); return; }
        if (event.key !== "Tab") return;
        const focusable = [...panel.current.querySelectorAll("button, a[href]"), header.current.querySelector(".site-header__toggle")];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      };
      addEventListener("keydown", onKey);
      panel.current?.querySelector(".site-menu__link")?.focus({ preventScroll: true });
      return () => { document.body.style.overflow = overflow; removeEventListener("keydown", onKey); };
    }
    if (hasOpened.current) header.current?.querySelector(".site-header__toggle")?.focus({ preventScroll: true });
  }, [open]);

  const visit = (event, id) => {
    setOpen(false);
    if (id === "customize") onAction?.();
    if (pathname !== ROUTE_PATHS.home || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const brandClick = (event) => {
    if (open) { event.preventDefault(); setOpen(false); return; }
    if (pathname !== ROUTE_PATHS.home) return;
    event.preventDefault();
    scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const startDrag = (event) => {
    if (!open || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const drawer = panel.current;
    if (!drawer) return;
    const currentY = Number(gsap.getProperty(drawer, "y")) + drawer.offsetHeight * Number(gsap.getProperty(drawer, "yPercent")) / 100;
    gsap.killTweensOf(drawer);
    const offset = Math.max(0, currentY);
    gsap.set(drawer, { yPercent: 0, y: offset });
    drag.current = { pointerId: event.pointerId, startY: event.clientY, offset, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.max(0, gesture.offset + event.clientY - gesture.startY);
    gsap.set(panel.current, { y: distance });
    const elapsed = event.timeStamp - gesture.lastTime;
    if (elapsed > 0) gesture.velocity = (event.clientY - gesture.lastY) / elapsed;
    gesture.lastY = event.clientY;
    gesture.lastTime = event.timeStamp;
  };

  const endDrag = (event) => {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    const drawer = panel.current;
    const travel = event.clientY - gesture.startY;
    if (event.type !== "pointercancel" && (travel > Math.min(100, drawer.offsetHeight * 0.2) || (travel > 45 && gesture.velocity > 0.65))) {
      setOpen(false);
    } else {
      gsap.to(drawer, { y: 0, duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.35, ease: "power3.out", overwrite: true });
    }
  };

  return createPortal(
    <div ref={root} className={"site-nav" + (lightInk ? " site-nav--light-ink" : "") + (open ? " site-nav--open" : "")}>
      <div ref={scrim} className="site-menu__scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <section ref={panel} id="site-menu" className="site-menu" aria-label="Main navigation" inert={!open}>
        <div className="site-menu__grab-area" aria-hidden="true" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <span className="site-menu__handle" />
        </div>
        <nav ref={linkList} className="site-menu__links" aria-label="Main navigation">
          {primaryLinks.map(([text, to, id], index) => <div className="site-menu__link-wrap" key={id}>
            <Link className="site-menu__link" to={to} onClick={(event) => visit(event, id)} aria-current={activeSection === id ? "page" : undefined}>
              <span className="site-menu__number">{String(index + 1).padStart(2, "0")}</span>
              <span className="site-menu__word">{text}</span>
            </Link>
          </div>)}
        </nav>
        <div className="site-menu__secondary">
          <span>Find your own way.</span>
          <nav aria-label="More navigation">
            {secondaryLinks.map(([text, to, id]) => <Link key={id} to={to} onClick={(event) => visit(event, id)} aria-current={activeSection === id ? "page" : undefined}>{text}</Link>)}
          </nav>
          <span className="site-menu__tagline">make it yours.</span>
        </div>
      </section>
      <header ref={header} className="site-header">
        <Link className="site-header__brand" to={ROUTE_PATHS.home} aria-label="Móimode home" onClick={brandClick}>
          <span className="site-header__logo-frame"><img className="site-header__logo" src="/images/moimode-logo.svg" alt="" /><img className="site-header__logo site-header__logo--light" src="/images/moimode-logo.svg" alt="" aria-hidden="true" /></span>
        </Link>
        <button className="site-header__toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen((value) => !value)}>
          <span>{open ? "CLOSE" : "MENU"}</span>
          <span ref={menuIcon} className="site-header__menu-glyph" aria-hidden="true">
            <span className="site-header__menu-line site-header__menu-line--top" />
            <span className="site-header__menu-line site-header__menu-line--middle" />
            <span className="site-header__menu-line site-header__menu-line--bottom" />
          </span>
        </button>
      </header>
    </div>, document.body,
  );
}
