import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import RoleSelectionModal from "./RoleSelectionModal";

/**
 * Shows the role selection modal ONLY for brand-new users who have
 * neither a creator profile nor a client profile yet.
 * Once they have at least one profile, they can manage both from Settings.
 */
export default function RoleSelectionWrapper() {
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        setChecked(true);
        return;
      }

      const user = await base44.auth.me();

      // If user already chose a role, don't interrupt
      if (user.role) {
        setChecked(true);
        return;
      }

      // Check if they already have any profile (edge-case safety)
      const [creatorProfiles, clientProfiles] = await Promise.all([
        base44.entities.CreatorProfile.filter({ created_by: user.email }),
        base44.entities.ClientProfile.filter({ created_by: user.email }),
      ]);

      const hasAnyProfile = creatorProfiles.length > 0 || clientProfiles.length > 0;

      if (!hasAnyProfile) {
        setShowModal(true);
      }

      setChecked(true);
    } catch {
      setChecked(true);
    }
  };

  if (!checked) return null;

  return (
    <RoleSelectionModal
      open={showModal}
      onClose={() => {
        setShowModal(false);
        window.dispatchEvent(new CustomEvent("lensly:roleSelected"));
      }}
    />
  );
}