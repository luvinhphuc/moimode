import { useEffect, useRef } from 'react';

import { gsap, useGSAP } from '../../../utils/gsap.js';

const SELECTORS = Object.freeze({
    intro: '[data-hero="intro"]',
    introMark: '[data-hero="intro-mark"]',
    introProgress: '[data-hero="intro-progress"]',
    makeText: '[data-hero="make-text"]',
    modelMotion: '[data-hero="model-motion"]',
    yoursText: '[data-hero="yours-text"]',
});

function getIntroStartScale(mark) {
    const radius = mark.offsetWidth / 2;
    if (!radius) return 1;

    return (Math.hypot(window.innerWidth, window.innerHeight) / radius) * 1.2;
}

function getIntroExitOffset() {
    return -Math.min(window.innerHeight * 0.64, 640);
}

function query(root, selector) {
    return root?.querySelector(selector);
}

function HeroAnimation({
    hasSceneError,
    isIntroDone,
    isSceneReady,
    onIntroComplete,
    rootRef,
}) {
    const introStartedRef = useRef(false);

    useGSAP(
        () => {
            const root = rootRef.current;
            const mark = query(root, SELECTORS.introMark);
            if (!root || !mark) return undefined;

            const setStartScale = () => {
                if (!introStartedRef.current) {
                    gsap.set(mark, { scale: getIntroStartScale(mark) });
                }
            };

            setStartScale();
            window.addEventListener('resize', setStartScale);

            return () => window.removeEventListener('resize', setStartScale);
        },
        { scope: rootRef },
    );

    useEffect(() => {
        if (isIntroDone) return undefined;

        document.body.classList.add('is-model-loading');
        return () => document.body.classList.remove('is-model-loading');
    }, [isIntroDone]);

    useGSAP(
        () => {
            if ((!isSceneReady && !hasSceneError) || hasSceneError)
                return undefined;

            const root = rootRef.current;
            const intro = query(root, SELECTORS.intro);
            const mark = query(root, SELECTORS.introMark);
            const progress = query(root, SELECTORS.introProgress);
            const modelMotion = query(root, SELECTORS.modelMotion);

            if (!intro || !mark || !progress || !modelMotion) return undefined;

            const media = gsap.matchMedia();

            media.add(
                {
                    reduceMotion: '(prefers-reduced-motion: reduce)',
                    standardMotion: '(prefers-reduced-motion: no-preference)',
                },
                (context) => {
                    if (context.conditions.reduceMotion) {
                        gsap.set(modelMotion, { y: 0 });
                        gsap.set([mark, progress], { autoAlpha: 0 });
                        onIntroComplete();
                        return undefined;
                    }

                    introStartedRef.current = true;

                    const motionRect = modelMotion.getBoundingClientRect();
                    gsap.set(modelMotion, {
                        y: -(window.innerHeight + motionRect.height),
                    });

                    const timeline = gsap.timeline({
                        defaults: { ease: 'power3.inOut' },
                        onComplete: onIntroComplete,
                    });

                    timeline
                        .addLabel('handover')
                        .to(
                            progress,
                            { autoAlpha: 0, duration: 0.3 },
                            'handover',
                        )
                        .to(
                            mark,
                            { scale: 1, duration: 1.35 },
                            'handover+=0.08',
                        )
                        .to(
                            mark,
                            {
                                y: getIntroExitOffset(),
                                duration: 0.62,
                                ease: 'power3.inOut',
                            },
                            '+=0.08',
                        );

                    return () => {
                        timeline.kill();
                        introStartedRef.current = false;
                    };
                },
            );

            return () => media.revert();
        },
        {
            dependencies: [hasSceneError, isSceneReady, onIntroComplete],
            revertOnUpdate: true,
            scope: rootRef,
        },
    );

    useGSAP(
        () => {
            if (!isIntroDone) return undefined;

            const root = rootRef.current;
            const modelMotion = query(root, SELECTORS.modelMotion);
            const words = [
                query(root, SELECTORS.makeText),
                query(root, SELECTORS.yoursText),
            ];

            if (!modelMotion || words.some((item) => !item)) {
                return undefined;
            }

            const media = gsap.matchMedia();

            media.add(
                {
                    base: '(min-width: 0px)',
                    reduceMotion: '(prefers-reduced-motion: reduce)',
                },
                (context) => {
                    const { reduceMotion } = context.conditions;

                    if (reduceMotion) {
                        gsap.set(modelMotion, { y: 0 });
                        gsap.set(words, {
                            autoAlpha: 1,
                            x: 0,
                            y: 0,
                            rotation: 0,
                            scale: 1,
                        });
                        return undefined;
                    }

                    const modelRect = modelMotion.getBoundingClientRect();
                    gsap.set(modelMotion, {
                        y: -(window.innerHeight + modelRect.height),
                    });
                    gsap.set(words, {
                        autoAlpha: 0,
                        y: 18,
                        scale: 0.96,
                    });
                    const timeline = gsap.timeline({
                        defaults: { ease: 'back.out(1.45)' },
                    });

                    timeline
                        .to(
                            modelMotion,
                            { y: 0, duration: 1.05, ease: 'power3.out' },
                            '>+0.1',
                        )
                        .to(words[0], {
                            autoAlpha: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.56,
                        })
                        .to(
                            words[1],
                            { autoAlpha: 1, y: 0, scale: 1, duration: 0.64 },
                            '>',
                        );

                    return () => {
                        timeline.kill();
                        gsap.set(modelMotion, { y: 0 });
                        gsap.set(words, {
                            autoAlpha: 0,
                            x: 0,
                            y: 0,
                            rotation: 0,
                            scale: 1,
                        });
                    };
                },
            );

            return () => media.revert();
        },
        { dependencies: [isIntroDone], revertOnUpdate: true, scope: rootRef },
    );

    return null;
}

export default HeroAnimation;
