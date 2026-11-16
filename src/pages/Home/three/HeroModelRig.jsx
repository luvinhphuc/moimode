import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import { MathUtils, Vector3 } from '../../../utils/three.js';
import { CAMERA } from '../config/sceneConfig.js';
import PlacedCharm from '../../Customize/three/PlacedCharm.jsx';

function fitCameraToModel({ camera, height, radius, width }) {
    const viewportWidth = Math.max(width, 1);
    const viewportHeight = Math.max(height, 1);
    const aspect = viewportWidth / viewportHeight;
    const verticalFov = MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const framing =
        viewportWidth < 768 ? (aspect < 0.8 ? 1.05 : 1.55) : 1.45;
    const distance = (radius / Math.sin(limitingFov / 2)) * framing;
    const direction = new Vector3(...CAMERA.direction).normalize();

    camera.position.set(
        direction.x * distance,
        direction.y * distance,
        direction.z * distance,
    );
    camera.near = Math.max(0.01, distance - radius * 3);
    camera.far = distance + radius * 8;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
}

function HeroModelRig({
    enablePointerMotion,
    model,
    modelSize,
    pose,
    radius,
    slots,
    transitionControlRef,
}) {
    const groupRef = useRef(null);
    const motionRef = useRef({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const reducedMotionRef = useRef(false);
    const spinAngleRef = useRef(0);
    const camera = useThree((state) => state.camera);
    const size = useThree((state) => state.size);
    const invalidate = useThree((state) => state.invalidate);
    const baseRotation = useMemo(
        () => pose.rotationDegrees.map(MathUtils.degToRad),
        [pose.rotationDegrees],
    );
    const rotationRef = useRef(baseRotation);
    const transitionStateRef = useRef({
        active: 0,
        invalidate,
        pointerInfluence: 1,
        rotationX: baseRotation[0],
        rotationY: baseRotation[1],
        rotationZ: baseRotation[2],
        poseActive: 0,
        spinActive: 0,
        scale: 1.45,
    });

    useLayoutEffect(() => {
        rotationRef.current = baseRotation;

        const transition = transitionStateRef.current;
        if (!transition.active) {
            transition.rotationX = baseRotation[0];
            transition.rotationY = baseRotation[1];
            transition.rotationZ = baseRotation[2];
        }
        invalidate();
    }, [baseRotation, invalidate]);

    useEffect(() => {
        if (!transitionControlRef) return undefined;

        const transition = transitionStateRef.current;
        transitionControlRef.current = transition;

        return () => {
            if (transitionControlRef.current === transition) {
                transitionControlRef.current = null;
            }
        };
    }, [transitionControlRef]);

    useEffect(() => {
        if (!enablePointerMotion) {
            targetRef.current.x = 0;
            targetRef.current.y = 0;
            motionRef.current.x = 0;
            motionRef.current.y = 0;
            invalidate();
            return undefined;
        }

        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncReducedMotion = () => {
            reducedMotionRef.current = media.matches;
            invalidate();
        };
        const handlePointerMove = (event) => {
            if (
                reducedMotionRef.current ||
                event.pointerType === 'touch'
            )
                return;

            targetRef.current.x = MathUtils.clamp(
                (event.clientX / window.innerWidth) * 2 - 1,
                -1,
                1,
            );
            targetRef.current.y = MathUtils.clamp(
                (event.clientY / window.innerHeight) * 2 - 1,
                -1,
                1,
            );
            invalidate();
        };
        const resetMotion = () => {
            targetRef.current.x = 0;
            targetRef.current.y = 0;
            invalidate();
        };

        syncReducedMotion();
        media.addEventListener?.('change', syncReducedMotion);
        window.addEventListener('pointermove', handlePointerMove, {
            passive: true,
        });
        window.addEventListener('blur', resetMotion);

        return () => {
            media.removeEventListener?.('change', syncReducedMotion);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('blur', resetMotion);
        };
    }, [enablePointerMotion, invalidate]);

    useLayoutEffect(() => {
        fitCameraToModel({
            camera,
            height: size.height,
            radius,
            width: size.width,
        });
        invalidate();
    }, [camera, invalidate, radius, size.height, size.width]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const motion = motionRef.current;
        const targetX = reducedMotionRef.current ? 0 : targetRef.current.x;
        const targetY = reducedMotionRef.current ? 0 : targetRef.current.y;
        const step = Math.min(delta, 0.05);
        motion.x = MathUtils.damp(motion.x, targetX, 5, step);
        motion.y = MathUtils.damp(motion.y, targetY, 5, step);
        const isSettling = Math.hypot(motion.x - targetX, motion.y - targetY) > 0.001;
        if (!isSettling) {
            motion.x = targetX;
            motion.y = targetY;
        }

        const [baseX, baseY, baseZ] = rotationRef.current;
        const transition = transitionStateRef.current;
        const pointerInfluence = transition.pointerInfluence;
        const usesTransitionPose = transition.poseActive || transition.active;
        const x = usesTransitionPose ? transition.rotationX : baseX;
        const y = usesTransitionPose ? transition.rotationY : baseY;
        const z = usesTransitionPose ? transition.rotationZ : baseZ;

        const isSpinning = transition.spinActive && !transition.active;
        if (isSpinning) {
            spinAngleRef.current += (step * Math.PI * 2) / 4;
        }

        groupRef.current.rotation.set(
            x - motion.y * 0.08 * pointerInfluence,
            y + motion.x * 0.12 * pointerInfluence + spinAngleRef.current,
            z - motion.x * 0.045 * pointerInfluence,
        );
        groupRef.current.position.y = -motion.y * 0.008 * pointerInfluence;
        groupRef.current.scale.setScalar(transition.scale);
        if (isSpinning || isSettling) invalidate();
    });

    return (
        <group ref={groupRef}>
            <primitive object={model} dispose={null} />
            <Suspense fallback={null}>
                {slots.map((slot) => (
                    <PlacedCharm
                        key={slot.name}
                        charmId={slot.charmId}
                        animateIn={false}
                        interactive={false}
                        modelSize={modelSize}
                        slot={slot}
                    />
                ))}
            </Suspense>
        </group>
    );
}

export default HeroModelRig;

