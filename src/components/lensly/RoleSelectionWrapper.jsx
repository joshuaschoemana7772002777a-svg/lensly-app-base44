/**
 * RoleSelectionWrapper — renders nothing on its own.
 * The onboarding gate is now driven by useOnboardingGate() hook,
 * not by automatic app-load checks. This file is kept as a no-op
 * so nothing in the app breaks if it's still imported.
 */
export default function RoleSelectionWrapper() {
  return null;
}