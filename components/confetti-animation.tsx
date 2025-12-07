"use client";

import { useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";

// ============================================================================
// Types
// ============================================================================

export interface ConfettiAnimationProps {
  /**
   * When true, triggers the confetti animation
   */
  trigger: boolean;
  /**
   * Optional callback when the animation completes
   */
  onComplete?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ConfettiAnimation component that displays a celebratory confetti effect
 * when triggered. Used to celebrate successful challenge completions.
 *
 * **Feature: architecture-challenges**
 * **Validates: Requirements 4.1**
 */
export function ConfettiAnimation({
  trigger,
  onComplete,
}: ConfettiAnimationProps) {
  const hasTriggeredRef = useRef(false);
  const previousTriggerRef = useRef(false);

  const fireConfetti = useCallback(() => {
    // Fire confetti from both sides for a more celebratory effect
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        onComplete?.();
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Fire from right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Cleanup function
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    // Only trigger when trigger changes from false to true
    if (trigger && !previousTriggerRef.current && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      fireConfetti();
    }

    // Reset when trigger goes back to false
    if (!trigger && previousTriggerRef.current) {
      hasTriggeredRef.current = false;
    }

    previousTriggerRef.current = trigger;
  }, [trigger, fireConfetti]);

  // This component doesn't render anything visible
  // The confetti is rendered directly to the canvas by the library
  return null;
}

/**
 * Utility function to determine if confetti should be triggered
 * based on evaluation result. This is used for property testing.
 *
 * **Feature: architecture-challenges, Property 11: Confetti trigger on success**
 * **Validates: Requirements 4.1**
 */
export function shouldTriggerConfetti(evaluationPassed: boolean): boolean {
  return evaluationPassed === true;
}
