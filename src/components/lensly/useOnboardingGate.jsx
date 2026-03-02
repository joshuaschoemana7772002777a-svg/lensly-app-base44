import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const TERMS_VERSION = "v1.0";

/**
 * Returns { gate, GateModal }
 * - gate(callback) — runs the callback only after login + terms + role are confirmed.
 *   Handles redirect to login if not authed, then shows the role/terms modal if needed.
 * - GateModal — a JSX element to render once in the parent component.
 */
export function useOnboardingGate() {
  const [showModal, setShowModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState(null);

  // Store pending callback in ref-style via state setter
  const gate = useCallback(async (callback) => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      // Save the fact that we need to resume — handled by CreatorProfile's existing intent system
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const user = await base44.auth.me();
    const needsTerms = !user.termsAcceptedAt || user.termsVersion !== TERMS_VERSION;
    const needsRole = !user.role || (user.role !== "client" && user.role !== "creator");

    if (needsTerms || needsRole) {
      // Store callback to run after modal completes
      setPendingCallback(() => callback);
      setShowModal(true);
      return;
    }

    // All good, run immediately
    callback();
  }, []);

  const handleGateSuccess = useCallback(() => {
    setShowModal(false);
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  const handleGateClose = useCallback(() => {
    setShowModal(false);
    setPendingCallback(null);
  }, []);

  return { gate, showModal, handleGateSuccess, handleGateClose };
}

export const TERMS_VERSION_CURRENT = TERMS_VERSION;