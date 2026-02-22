import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CreatorCard from "./CreatorCard";

export default function OnboardingSuccessModal({ open, profile, onContinue }) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-blue-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Your Profile is Live!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-blue-50 text-sm"
          >
            Clients can now discover you and send requests
          </motion.p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 text-neutral-600 mb-3">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">How you appear in Discover</span>
          </div>
          <div className="w-48 mx-auto">
            <CreatorCard creator={profile} isFavourite={false} onToggleFavourite={() => {}} />
          </div>

          <Button
            onClick={onContinue}
            className="w-full mt-6 h-12 rounded-xl bg-blue-500 hover:bg-blue-600"
          >
            Continue to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}