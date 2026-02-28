import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import RoleSelectionModal from "./RoleSelectionModal";

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
      
      // Only show if user has no role set
      if (!user.role) {
        setShowModal(true);
      }
      
      setChecked(true);
    } catch (error) {
      setChecked(true);
    }
  };

  if (!checked) return null;

  return (
    <RoleSelectionModal
      open={showModal}
      onClose={() => {
        setShowModal(false);
        // Signal other components that role was just selected
        window.dispatchEvent(new CustomEvent("lensly:roleSelected"));
      }}
    />
  );
}