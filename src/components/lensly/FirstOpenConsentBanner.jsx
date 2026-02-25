import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function FirstOpenConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenConsent = localStorage.getItem("lensly_consent_seen");
    if (!hasSeenConsent) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("lensly_consent_seen", "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-0 right-0 z-50 px-4"
        >
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-neutral-200 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-neutral-700 leading-relaxed">
                  By using Lensly, you agree to our{" "}
                  <a
                    href="https://getlenslyapp.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium"
                  >
                    Terms & Conditions
                  </a>
                  .
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <Button
              onClick={handleDismiss}
              className="w-full mt-4 rounded-xl bg-blue-500 hover:bg-blue-600 h-10"
            >
              Got it
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}