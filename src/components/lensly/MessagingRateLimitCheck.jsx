import { base44 } from "@/api/base44Client";

// Simple hash function for duplicate detection
const hashMessage = (text) => {
  let hash = 0;
  const normalized = text.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Check if user is currently rate limited
const isRateLimited = async (userEmail) => {
  const now = new Date();
  const activeFlags = await base44.entities.AbuseFlag.filter({
    user_email: userEmail,
    flag_type: "rate_limited"
  });
  
  // Check if any rate limit is still active
  const activeLimits = activeFlags.filter(flag => {
    if (!flag.expires_at) return false;
    return new Date(flag.expires_at) > now;
  });
  
  return activeLimits.length > 0;
};

// Main rate limit check function
export const checkMessagingRateLimit = async (userEmail, creatorProfileId, messageContent) => {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check if already rate limited
  const isLimited = await isRateLimited(userEmail);
  if (isLimited) {
    return {
      allowed: false,
      message: "You're sending messages quickly. Please wait before continuing."
    };
  }

  // Get recent messaging activity
  const recentActivity = await base44.entities.MessagingActivity.filter({
    sender_email: userEmail
  });

  // Filter by time windows
  const last10Minutes = recentActivity.filter(a => 
    new Date(a.created_date) > tenMinutesAgo
  );
  const lastHour = recentActivity.filter(a => 
    new Date(a.created_date) > oneHourAgo
  );

  // Count unique creators
  const uniqueCreatorsLast10Min = new Set(last10Minutes.map(a => a.creator_profile_id));
  const uniqueCreatorsLastHour = new Set(lastHour.map(a => a.creator_profile_id));

  // Don't count if messaging the same creator again
  const isNewCreator = !uniqueCreatorsLast10Min.has(creatorProfileId);

  // If messaging existing creator, always allow
  if (!isNewCreator) {
    return { allowed: true };
  }

  const newUniqueCount10Min = uniqueCreatorsLast10Min.size + 1;
  const newUniqueCountHour = uniqueCreatorsLastHour.size + 1;

  // Check for duplicate messages to multiple creators
  if (messageContent) {
    const messageHash = hashMessage(messageContent);
    const duplicateMessages = lastHour.filter(a => a.message_hash === messageHash);
    
    if (duplicateMessages.length >= 4) {
      // 4 existing + 1 new = 5 total
      // Rate limit immediately
      const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
      await base44.entities.AbuseFlag.create({
        user_email: userEmail,
        flag_type: "rate_limited",
        reason: "Duplicate message sent to 5+ unique creators within 1 hour",
        unique_creators_count: duplicateMessages.length + 1,
        time_window_minutes: 60,
        expires_at: expiresAt.toISOString()
      });
      
      return {
        allowed: false,
        message: "You're sending messages quickly. Please wait before continuing."
      };
    }
  }

  // Rate limiting rules
  if (newUniqueCount10Min >= 10 || newUniqueCountHour >= 15) {
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
    await base44.entities.AbuseFlag.create({
      user_email: userEmail,
      flag_type: "rate_limited",
      reason: `Messaged ${newUniqueCount10Min} unique creators in 10 minutes or ${newUniqueCountHour} in 1 hour`,
      unique_creators_count: Math.max(newUniqueCount10Min, newUniqueCountHour),
      time_window_minutes: newUniqueCount10Min >= 10 ? 10 : 60,
      expires_at: expiresAt.toISOString()
    });
    
    return {
      allowed: false,
      message: "You're sending messages quickly. Please wait before continuing."
    };
  }

  // Manual review trigger
  if (newUniqueCountHour >= 20) {
    await base44.entities.AbuseFlag.create({
      user_email: userEmail,
      flag_type: "manual_review",
      reason: `Messaged ${newUniqueCountHour} unique creators within 1 hour`,
      unique_creators_count: newUniqueCountHour,
      time_window_minutes: 60
    });
  }

  // Check for repeated rate limit hits in 24 hours
  const rateLimitsLast24Hours = await base44.entities.AbuseFlag.filter({
    user_email: userEmail,
    flag_type: "rate_limited"
  });
  const recentRateLimits = rateLimitsLast24Hours.filter(f => 
    new Date(f.created_date) > oneDayAgo
  );
  
  if (recentRateLimits.length >= 3) {
    await base44.entities.AbuseFlag.create({
      user_email: userEmail,
      flag_type: "manual_review",
      reason: "Repeatedly hit rate limits within 24 hours",
      unique_creators_count: recentRateLimits.length,
      time_window_minutes: 1440
    });
  }

  // Soft flag (internal only, no user notification)
  if (newUniqueCount10Min >= 6 && newUniqueCount10Min < 10) {
    await base44.entities.AbuseFlag.create({
      user_email: userEmail,
      flag_type: "soft_flag",
      reason: `Messaged ${newUniqueCount10Min} unique creators within 10 minutes`,
      unique_creators_count: newUniqueCount10Min,
      time_window_minutes: 10
    });
  }

  return { allowed: true };
};

// Track messaging activity
export const trackMessagingActivity = async (userEmail, creatorProfileId, messageContent, conversationId) => {
  const messageHash = messageContent ? hashMessage(messageContent) : null;
  
  await base44.entities.MessagingActivity.create({
    sender_email: userEmail,
    creator_profile_id: creatorProfileId,
    message_hash: messageHash,
    conversation_id: conversationId
  });
};