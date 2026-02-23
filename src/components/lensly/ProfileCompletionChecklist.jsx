import React from "react";
import { CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileCompletionChecklist({ profile }) {
  const checks = [
    {
      label: "Add at least one portfolio image",
      complete: profile?.portfolio_items?.length > 0,
      key: "portfolio"
    },
    {
      label: "Select at least one category",
      complete: profile?.categories?.length > 0,
      key: "categories"
    },
    {
      label: "Select at least one operating area",
      complete: profile?.service_areas?.length > 0,
      key: "areas"
    },
    {
      label: "Publish your profile",
      complete: profile?.is_published,
      key: "publish"
    }
  ];

  const completedCount = checks.filter(c => c.complete).length;
  const isFullyComplete = completedCount === checks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${
        isFullyComplete 
          ? "bg-green-50 border-green-200" 
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isFullyComplete ? "bg-green-100" : "bg-blue-100"
        }`}>
          {isFullyComplete ? (
            <Eye className="w-5 h-5 text-green-600" />
          ) : (
            <EyeOff className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${
            isFullyComplete ? "text-green-900" : "text-blue-900"
          }`}>
            {isFullyComplete 
              ? "Profile is visible on Discover!" 
              : "Complete your profile to be visible"}
          </h3>
          <p className={`text-xs mt-1 ${
            isFullyComplete ? "text-green-700" : "text-blue-700"
          }`}>
            {isFullyComplete
              ? "Clients can now find and contact you"
              : `${completedCount} of ${checks.length} requirements met`}
          </p>
        </div>
      </div>

      {!isFullyComplete && (
        <div className="space-y-2">
          {checks.map((check, i) => (
            <motion.div
              key={check.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2"
            >
              {check.complete ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              )}
              <span className={`text-xs ${
                check.complete ? "text-green-700" : "text-blue-700"
              }`}>
                {check.label}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}