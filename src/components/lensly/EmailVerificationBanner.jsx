import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailVerificationBanner() {
  return (
    <div className="mx-5 mt-4 mb-2 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">Email Verification Required</h3>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Please verify your email to message creators, send requests, and publish your profile.
          </p>
          <Button className="mt-3 h-8 text-xs rounded-xl bg-amber-600 hover:bg-amber-700">
            Verify Email
          </Button>
        </div>
      </div>
    </div>
  );
}