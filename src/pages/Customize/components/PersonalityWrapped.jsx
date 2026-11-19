import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    Download,
    Send,
} from 'lucide-react';

import BrandStar from '../../../components/BrandStar.jsx';
import { Shape } from '../../../components/Shapes.jsx';
import { gsap, useGSAP } from '../../../utils/gsap.js';
import { CHARM_BY_ID, CHARM_CATEGORIES } from '../config/customizerConfig.js';
import {
    PERSONALITIES,
    PERSONALITY_ORDER,
} from '../config/personalityConfig.js';
import {
    createPersonalityCardBlob,
    downloadBlob,
} from '../utils/exportPersonalityCard.js';
import { CROCS_EXPORT_SIZE, fitCrocsPngSize } from '../utils/exportCrocsImage.js';
import CustomizerScene from '../three/CustomizerScene.jsx';
import { usePageTransition } from '../../../components/PageTransition/PageTransitionContext.js';
import PersonalityCard from './PersonalityCard.jsx';
import StorySubmission from './StorySubmission.jsx';
import './PersonalityWrapped.css';

function collectionLabel(id) {
    return (
        CHARM_CATEGORIES.find((category) => category.id === id)?.label ?? null
    );
}

function CrocsPreview({ colour, placements, rotations, className = '', onReady, onError }) {
    return (
        <div
            className={className}
            role="img"
            aria-label={`Your customized ${colour.label} Crocs with selected charms`}
        >
            <CustomizerScene
                bodyColour={colour.value}
                compactPreview
                controlsEnabled={false}
                onError={onError}
                onModelReady={onReady}
                onSlotSelect={() => {}}
                placements={placements}
                rotations={rotations}
                view="side"
            />
        </div>
    );
}

function PersonalityWrapped({
    colour,
    placements,
    rotations,
    result,
    onCustomizeAgain,
    onReady,
}) {
    const { runTransition } = usePageTransition();
    const [stage, setStage] = useState('decode');
    const [storyOpen, setStoryOpen] = useState(false);
    const [revealDone, setRevealDone] = useState(false);
    const [exportRequestId, setExportRequestId] = useState(null);
    const [actionError, setActionError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionBusy, setActionBusy] = useState(false);
    const rootRef = useRef(null);
    const previewReadyRef = useRef(false);
    const exportIdRef = useRef(0);
    const exportPendingRef = useRef(null);
    const exportTimerRef = useRef(null);
    const personality = PERSONALITIES[result.primaryPersonality];
    const stats = result.customizationStats;
    const selectedCharms = useMemo(
        () =>
            [...new Set(Object.values(placements))]
                .slice(0, 5)
                .map((id) => CHARM_BY_ID[id])
                .filter(Boolean),
        [placements],
    );

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [stage]);

    const markPreviewReady = useCallback(() => {
        if (previewReadyRef.current) return;
        previewReadyRef.current = true;
        onReady?.();
    }, [onReady]);

    const failCrocsExport = useCallback((message = 'Your Crocs could not be prepared. Please try again.') => {
        const pending = exportPendingRef.current;
        if (!pending) return;
        window.clearTimeout(exportTimerRef.current);
        exportTimerRef.current = null;
        exportPendingRef.current = null;
        setExportRequestId(null);
        pending.reject(new Error(message));
    }, []);

    const handleCapture = useCallback(async (blob) => {
        const pending = exportPendingRef.current;
        if (!pending) return;
        try {
            const png = await fitCrocsPngSize(blob);
            if (exportPendingRef.current !== pending) return;
            window.clearTimeout(exportTimerRef.current);
            exportTimerRef.current = null;
            exportPendingRef.current = null;
            setExportRequestId(null);
            pending.resolve(png);
        } catch {
            failCrocsExport('Your Crocs image is too large or could not be prepared. Please try again.');
        }
    }, [failCrocsExport]);

    const handleCaptureError = useCallback(() => {
        failCrocsExport('Your Crocs or one of the selected charms could not be loaded. Please try again.');
    }, [failCrocsExport]);

    const exportCrocsPng = useCallback(() => {
        if (exportPendingRef.current) {
            return Promise.reject(new Error('Your Crocs image is already being prepared.'));
        }
        if (!colour.value || !result.primaryPersonality || !placements) {
            return Promise.reject(new Error('Your customization is unavailable. Please return to the customizer and try again.'));
        }

        const requestId = ++exportIdRef.current;
        const promise = new Promise((resolve, reject) => {
            exportPendingRef.current = { resolve, reject };
        });
        setExportRequestId(requestId);
        exportTimerRef.current = window.setTimeout(() => {
            failCrocsExport('The Crocs model took too long to load. Please try again.');
        }, 30000);
        return promise;
    }, [colour, failCrocsExport, placements, result]);

    useEffect(() => () => {
        window.clearTimeout(exportTimerRef.current);
        const pending = exportPendingRef.current;
        exportPendingRef.current = null;
        pending?.reject(new Error('Crocs export was interrupted. Please try again.'));
    }, []);
    const closeStory = useCallback(() => setStoryOpen(false), []);
    const goToStage = useCallback((nextStage) => {
        if (stage === nextStage) return;
        const order = { decode: 0, reveal: 1, card: 2 };
        runTransition({
            direction: order[nextStage] < order[stage] ? 'back' : 'forward',
            onCovered: () => {
                if (nextStage === 'reveal') setRevealDone(false);
                setStage(nextStage);
            },
            ready: () => new Promise((resolve) => requestAnimationFrame(() => {
                const images = rootRef.current?.querySelectorAll('.wrapped-stack__card, .wrapped-card__face') ?? [];
                Promise.all([...images].map((image) => image.decode?.().catch(() => {}) ?? Promise.resolve())).then(resolve);
            })),
        });
    }, [runTransition, stage]);

    useGSAP(
        () => {
            const reduced = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;
            const startOnReveal = (timeline) => {
                const phase = document.querySelector('.page-wipe')?.dataset.phase;
                if (phase === 'covering' || phase === 'covered') {
                    const play = () => timeline.play();
                    window.addEventListener('moimode-transition-reveal', play, { once: true });
                    return () => window.removeEventListener('moimode-transition-reveal', play);
                }
                timeline.play();
            };
            const startAfterTransition = (timeline) => {
                if (document.querySelector('.page-wipe')?.dataset.phase === 'idle') {
                    timeline.play();
                    return () => timeline.kill();
                }
                const play = () => timeline.play();
                window.addEventListener('moimode-transition-complete', play, { once: true });
                return () => {
                    window.removeEventListener('moimode-transition-complete', play);
                    timeline.kill();
                };
            };
            if (stage === 'decode') {
                if (reduced) return;
                const timeline = gsap.timeline({
                    paused: true,
                    defaults: { ease: 'power3.out' },
                });
                timeline.from('.wrapped-decode__intro', {
                    y: 24,
                    autoAlpha: 0,
                    duration: 0.55,
                });
                timeline.from(
                    '.wrapped-decode__fact',
                    { y: 30, autoAlpha: 0, duration: 0.5, stagger: 0.18 },
                    '-=0.2',
                );
                timeline.fromTo('.wrapped-decode__scan', { top: '8%', autoAlpha: 0 }, { top: '88%', autoAlpha: 0.8, duration: 0.8, ease: 'power2.inOut' }, 0.34);
                timeline.to('.wrapped-decode__scan', { autoAlpha: 0, duration: 0.14 }, 1.03);
                const stickerNodes = rootRef.current.querySelectorAll('.wrapped-decode__charms img');
                if (stickerNodes.length) timeline.from(stickerNodes, { scale: 0, rotation: -25, autoAlpha: 0, duration: 0.36, stagger: 0.08, ease: 'back.out(2)' }, 0.55);
                timeline.from('.wrapped-decode__shape', { scale: 0.45, rotation: -22, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.5)' }, 0.45);
                timeline.from('.wrapped-decode > .wrapped-cta', { y: 12, autoAlpha: 0, duration: 0.35 }, 0.9);
                rootRef.current
                    .querySelectorAll('[data-count]')
                    .forEach((element) => {
                        const target = Number(element.dataset.count);
                        timeline.fromTo(
                            element,
                            { textContent: 0 },
                            {
                                textContent: target,
                                snap: { textContent: 1 },
                                duration: 0.8,
                                ease: 'power2.out',
                            },
                        );
                    });
                return startOnReveal(timeline);
            }
            if (stage === 'reveal') {
                const cards = [
                    ...rootRef.current.querySelectorAll('.wrapped-stack__card'),
                ];
                const winner = cards.find(
                    (card) =>
                        card.dataset.personality === result.primaryPersonality,
                );
                const others = cards.filter((card) => card !== winner);
                if (reduced) {
                    gsap.set(others, { autoAlpha: 0 });
                    gsap.set(winner, { x: 0, y: 0, rotation: 0, scale: 1 });
                    setRevealDone(true);
                    return;
                }
                cards.forEach((card, index) =>
                    gsap.set(card, {
                        x: (index - 1.5) * 55,
                        y: Math.abs(index - 1.5) * 24,
                        rotation: (index - 1.5) * 9,
                        scale: 0.9,
                    }),
                );
                const winnerEase = {
                    playful: 'elastic.out(1, 0.45)',
                    minimalist: 'power2.out',
                    creative: 'back.out(1.7)',
                    bold: 'expo.out',
                }[result.primaryPersonality];
                const timeline = gsap.timeline({
                    paused: true,
                    onComplete: () => setRevealDone(true),
                });
                timeline.from('.wrapped-reveal__heading', {
                    y: 20,
                    autoAlpha: 0,
                    duration: 0.45,
                });
                timeline.to(
                    others,
                    {
                        x: (index) => (index % 2 ? 480 : -480),
                        y: (index) => index * 60 - 80,
                        rotation: (index) => (index % 2 ? 28 : -28),
                        autoAlpha: 0,
                        duration: 0.8,
                        stagger: 0.08,
                        ease: 'power3.in',
                    },
                    '+=0.2',
                );
                timeline.to(
                    winner,
                    {
                        x: 0,
                        y: 0,
                        rotation: 0,
                        scale:
                            result.primaryPersonality === 'bold' ? 1.1 : 1.04,
                        duration:
                            result.primaryPersonality === 'playful'
                                ? 1.1
                                : 0.65,
                        ease: winnerEase,
                    },
                    '-=0.35',
                );
                if (result.primaryPersonality === 'playful') {
                    timeline.from(
                        '.wrapped-reveal__blob',
                        {
                            scale: 0,
                            rotation: -50,
                            autoAlpha: 0,
                            stagger: 0.12,
                            duration: 0.65,
                            ease: 'back.out(2)',
                        },
                        '-=0.65',
                    );
                }
                if (result.primaryPersonality === 'minimalist') {
                    timeline.fromTo('.wrapped-reveal__name', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.65, ease: 'power2.inOut' }, '-=0.4');
                }
                if (result.primaryPersonality === 'creative') {
                    timeline.fromTo(
                        '.wrapped-reveal__scribble path',
                        { strokeDashoffset: 1300 },
                        {
                            strokeDashoffset: 0,
                            duration: 1,
                            ease: 'power2.out',
                        },
                        '-=0.65',
                    );
                    timeline.from(
                        '.wrapped-reveal__sparkle',
                        {
                            scale: 0,
                            autoAlpha: 0,
                            stagger: 0.1,
                            duration: 0.5,
                            ease: 'back.out(2)',
                        },
                        '-=0.5',
                    );
                }
                if (result.primaryPersonality === 'bold') {
                    timeline.from(
                        '.wrapped-reveal__shape',
                        {
                            scale: 0,
                            rotation: -80,
                            duration: 0.35,
                            ease: 'power4.out',
                        },
                        '-=0.6',
                    );
                    timeline.from('.wrapped-reveal__name', { scale: 1.35, letterSpacing: '0.08em', duration: 0.48, ease: 'expo.out' }, '-=0.35');
                }
                timeline.from(
                    '.wrapped-reveal__name',
                    { y: 22, autoAlpha: 0, duration: 0.45 },
                    '-=0.3',
                );
                return startOnReveal(timeline);
            }
            if (stage === 'card') {
                const printWindow = rootRef.current.querySelector('.wrapped-final__print-window');
                const transport = rootRef.current.querySelector('.wrapped-final__print-transport');
                const develop = rootRef.current.querySelector('.wrapped-final__print-develop');
                printWindow.inert = true;
                if (reduced) {
                    gsap.set(transport, { yPercent: 0, y: 0, rotation: 0 });
                    gsap.set(printWindow, { clipPath: 'none', pointerEvents: 'auto' });
                    gsap.set(develop, { filter: 'none' });
                    printWindow.inert = false;
                    return;
                }

                gsap.set(transport, { yPercent: -101, y: 0, rotation: 0, transformOrigin: '50% 8%', willChange: 'transform' });
                gsap.set(develop, { filter: 'saturate(0.06) contrast(0.65) brightness(1.38)' });
                const timeline = gsap.timeline({
                    paused: true,
                    onComplete: () => {
                        gsap.set(transport, { clearProps: 'willChange' });
                        gsap.set(develop, { clearProps: 'filter' });
                        printWindow.inert = false;
                        printWindow.style.pointerEvents = 'auto';
                    },
                });
                timeline.from('.wrapped-final__content', {
                    y: 32,
                    autoAlpha: 0,
                    duration: 0.65,
                    ease: 'power3.out',
                }, 0);

                // The feed matches the prototype's three brief roller pauses.
                timeline.addLabel('feed', 0.3)
                    .to(transport, { yPercent: -80, duration: 0.363, ease: 'none' }, 'feed')
                    .to(transport, { yPercent: -48, duration: 0.445, ease: 'none' }, 'feed+=0.413')
                    .to(transport, { yPercent: -19, duration: 0.429, ease: 'none' }, 'feed+=0.908')
                    .to(transport, { yPercent: 0, duration: 0.264, ease: 'none' }, 'feed+=1.387')
                    .set(printWindow, { clipPath: 'none' }, 'feed+=1.651')
                    .to(transport, { y: 10, rotation: 2.2, duration: 0.28, ease: 'power2.in' }, 'feed+=1.72')
                    .to(transport, { y: -2, rotation: -0.8, duration: 0.16, ease: 'power2.out' })
                    .to(transport, { y: 0, rotation: 0, duration: 0.16, ease: 'power2.out' })
                    .to(develop, { filter: 'saturate(0.18) contrast(0.76) brightness(1.24)', duration: 1.65, ease: 'none' }, 'feed')
                    .to(develop, { filter: 'none', duration: 0.9, ease: 'power2.out' }, 'feed+=1.65');
                return startAfterTransition(timeline);
            }
        },
        { scope: rootRef, dependencies: [stage, result.primaryPersonality] },
    );

    async function handleCardAction(mode) {
        setActionBusy(true);
        setActionError('');
        setActionMessage('');
        try {
            const blob = await createPersonalityCardBlob({ result });
            const filename = `MOIMODE-${result.primaryPersonality}-story.png`;
            if (mode === 'share') {
                const file = new File([blob], filename, { type: 'image/png' });
                if (
                    navigator.share &&
                    navigator.canShare?.({ files: [file] })
                ) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: personality.name,
                            text: 'My MOIMODE Style DNA',
                        });
                    } catch (error) {
                        if (error.name !== 'AbortError') throw error;
                    }
                } else {
                    downloadBlob(blob, filename);
                    setActionMessage(
                        "Image sharing isn't available here, so your card was downloaded.",
                    );
                }
            } else {
                downloadBlob(blob, filename);
            }
        } catch (error) {
            setActionError(
                error.message ??
                    'Could not create your card. Please try again.',
            );
        } finally {
            setActionBusy(false);
        }
    }

    return (
        <main
            ref={rootRef}
            className={`wrapped wrapped--${stage} wrapped--${result.primaryPersonality}`}
            style={{ '--wrapped-theme': personality.theme }}
        >
            {stage === 'decode' ? (
                <section
                    className="wrapped-decode"
                    aria-label="Decode your style"
                >
                    <div className="wrapped-decode__intro">
                        <p className="wrapped-eyebrow">
                            01 / DECODE YOUR STYLE
                        </p>
                        <h1>
                            Every little choice
                            <br />
                            says something.
                        </h1>
                        <p>
                            Your colours. Your charms. Your story. Let’s
                            discover your style DNA.
                        </p>
                    </div>
                    <div className="wrapped-decode__grid">
                        <div className="wrapped-decode__fact wrapped-decode__fact--colour">
                            <span>YOUR COLOUR</span>
                            <i style={{ backgroundColor: colour.value }} />
                            <strong>{colour.label}</strong>
                        </div>
                        <div className="wrapped-decode__fact">
                            <span>CHARMS PLACED</span>
                            <strong data-count={stats.charmCount}>
                                {stats.charmCount}
                            </strong>
                        </div>
                        <div className="wrapped-decode__fact">
                            <span>COLLECTIONS EXPLORED</span>
                            <strong data-count={stats.collectionCount}>
                                {stats.collectionCount}
                            </strong>
                        </div>
                        <div className="wrapped-decode__fact">
                            <span>YOUR TOP COLLECTION</span>
                            <strong className="wrapped-decode__top">
                                {collectionLabel(stats.topCollection) ??
                                    'Your canvas is clear'}
                            </strong>
                        </div>
                    </div>
                    <div className="wrapped-decode__shoe">
                        <CrocsPreview
                            colour={colour}
                            onError={markPreviewReady}
                            onReady={markPreviewReady}
                            placements={placements}
                            rotations={rotations}
                            className="wrapped-shoe"
                        />
                        <span className="wrapped-decode__scan" aria-hidden="true" />
                    </div>
                    <div className="wrapped-decode__charms" aria-hidden="true">
                        {selectedCharms.map((charm) => (
                            <img
                                key={charm.id}
                                src={`/model/charms/previews/${charm.id}.png`}
                                alt=""
                            />
                        ))}
                    </div>
                    <Shape
                        type="wonkyStar"
                        className="wrapped-decode__shape"
                        size={110}
                    />
                    <button
                        type="button"
                        className="wrapped-cta"
                        onClick={() => goToStage('reveal')}
                    >
                        Reveal my personality <ArrowRight size={20} />
                    </button>
                </section>
            ) : null}

            {stage === 'reveal' ? (
                <section
                    className="wrapped-reveal"
                    aria-label="Personality reveal"
                >
                    <BrandStar className="wrapped-reveal__star" />
                    <p className="wrapped-eyebrow">02 / THE REVEAL</p>
                    <h1 className="wrapped-reveal__heading">
                        Meet your alter ego.
                    </h1>
                    <div className="wrapped-stack" aria-hidden="true">
                        {PERSONALITY_ORDER.map((key) => (
                            <img
                                key={key}
                                className="wrapped-stack__card"
                                data-personality={key}
                                src={PERSONALITIES[key].front}
                                alt=""
                            />
                        ))}
                    </div>
                    {result.primaryPersonality === 'playful' ? (
                        <div
                            className="wrapped-reveal__blobs"
                            aria-hidden="true"
                        >
                            <Shape
                                type="groovyBlob"
                                size={100}
                                className="wrapped-reveal__blob"
                            />
                            <Shape
                                type="doubleBubble"
                                size={75}
                                className="wrapped-reveal__blob"
                            />
                        </div>
                    ) : null}
                    {result.primaryPersonality === 'creative' ? (
                        <div
                            className="wrapped-reveal__creative"
                            aria-hidden="true"
                        >
                            <svg
                                className="wrapped-reveal__scribble"
                                viewBox="0 0 600 480"
                            >
                                <path d="M95 258 C55 135 158 48 310 48 C510 48 566 142 536 286 C504 425 331 458 148 398 C63 369 42 313 95 258" />
                            </svg>
                            <Shape
                                type="twinSparkle"
                                size={70}
                                className="wrapped-reveal__sparkle"
                            />
                            <Shape
                                type="sparkle"
                                size={45}
                                className="wrapped-reveal__sparkle"
                            />
                        </div>
                    ) : null}
                    <Shape
                        type={
                            result.primaryPersonality === 'bold'
                                ? 'sunburst'
                                : 'sparkle'
                        }
                        className="wrapped-reveal__shape"
                        size={120}
                    />
                    <h2 className="wrapped-reveal__name">{personality.name}</h2>
                    <p className="wrapped-reveal__keywords">
                        {personality.keywords.join(' · ')}
                    </p>
                    {revealDone ? (
                        <button
                            type="button"
                            className="wrapped-cta"
                            onClick={() => goToStage('card')}
                        >
                            See my card <ArrowRight size={20} />
                        </button>
                    ) : null}
                </section>
            ) : null}

            {stage === 'card' ? (
                <section
                    className="wrapped-final"
                    aria-label="Your personalized card"
                >
                    <div className="wrapped-final__content">
                        <p className="wrapped-eyebrow">
                            03 / YOUR PERSONALIZED CARD
                        </p>
                        <h1>{personality.name}</h1>
                        <p className="wrapped-final__keywords">
                            {personality.keywords.join(' · ')}
                        </p>
                        <div className="wrapped-final__grid">
                            <div className="wrapped-final__product">
                            <CrocsPreview
                                    colour={colour}
                                onError={markPreviewReady}
                                onReady={markPreviewReady}
                                placements={placements}
                                rotations={rotations}
                                    className="wrapped-shoe"
                                />
                                <div className="wrapped-final__swatch">
                                    <i
                                        style={{
                                            backgroundColor: colour.value,
                                        }}
                                    />{' '}
                                    Your {colour.label} Crocs
                                </div>
                            </div>
                            <div className="wrapped-final__card">
                                <span className="wrapped-final__print-slot" aria-hidden="true" />
                                <div className="wrapped-final__print-window" inert>
                                    <div className="wrapped-final__print-transport">
                                        <div className="wrapped-final__print-develop">
                                            <PersonalityCard
                                                personalityId={result.primaryPersonality}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p>Tap or click to flip the card</p>
                            </div>
                        </div>
                        {actionError ? (
                            <p className="wrapped-final__notice" role="alert">
                                {actionError}
                            </p>
                        ) : null}
                        {actionMessage ? (
                            <p className="wrapped-final__notice" role="status">
                                {actionMessage}
                            </p>
                        ) : null}
                        <div className="wrapped-final__actions">
                            <button
                                type="button"
                                className="wrapped-cta"
                                disabled={actionBusy}
                                onClick={() => handleCardAction('download')}
                            >
                                <Download size={19} /> Download Card
                            </button>
                            <button
                                type="button"
                                className="wrapped-cta wrapped-cta--outline"
                                disabled={actionBusy}
                                onClick={() => setStoryOpen(true)}
                            >
                                <Send size={19} /> Share Your Story
                            </button>
                            <button
                                type="button"
                                className="wrapped-cta wrapped-cta--quiet"
                                onClick={onCustomizeAgain}
                            >
                                <ArrowLeft size={19} /> Customize Again
                            </button>
                        </div>
                        {actionBusy ? (
                            <p role="status">Preparing your card…</p>
                        ) : null}
                    </div>
                </section>
            ) : null}
            {storyOpen ? (
                <StorySubmission
                    colour={colour}
                    onExportCrocs={exportCrocsPng}
                    placements={placements}
                    result={result}
                    onClose={closeStory}
                />
            ) : null}
            {exportRequestId !== null ? (
                <div
                    className="wrapped-export"
                    aria-hidden="true"
                    key={exportRequestId}
                    style={{ width: CROCS_EXPORT_SIZE, height: CROCS_EXPORT_SIZE }}
                >
                    <CustomizerScene
                        bodyColour={colour.value}
                        captureMode
                        compactPreview
                        controlsEnabled={false}
                        onCapture={handleCapture}
                        onCaptureError={handleCaptureError}
                        onError={handleCaptureError}
                        onSlotSelect={() => {}}
                        placements={placements}
                        rotations={rotations}
                        view="side"
                    />
                </div>
            ) : null}
        </main>
    );
}

export default PersonalityWrapped;
