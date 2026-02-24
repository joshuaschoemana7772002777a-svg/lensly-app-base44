import React from "react";

export default function ProfileAvatar({ 
  photoUrl, 
  displayName, 
  size = "md",
  className = "" 
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-xl",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    const firstInitial = words[0].charAt(0);
    const lastInitial = words[words.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt={displayName || "Profile"}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
          <span className="font-bold text-white">
            {getInitials(displayName)}
          </span>
        </div>
      )}
    </div>
  );
}