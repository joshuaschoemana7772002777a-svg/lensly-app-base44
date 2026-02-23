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

// Check if user is currently rate limited or under review
const checkActiveRestrictions = async (userEmail) => {
  const now = new Date();
  const activeFlags = await base44.entities.RequestAbuseFlag.filter({
    user_email: userEmail
  });
  
  // Check for manual review
  const manualReview = activeFlags.find(f => f.flag_type === "manual_review");
  if (manualReview) {
    return {
      blocked: true,
      type: "manual_review",
      message: "Your account is under review."
    };
  }
  
  // Check for active rate limits
  const activeLimits = activeFlags.filter(flag => {
    if (flag.flag_type !== "rate_limited") return false;
    if (!flag.expires_at) return false;
    return new Date(flag.expires_at) > now;
  });
  
  if (activeLimits.length > 0) {
    return {
      blocked: true,
      type: "rate_limited",
      message: "You're sending requests quickly. Please wait before continuing."
    };
  }
  
  return { blocked: false };
};

// Main request abuse detection function
export const checkRequestAbuseLimit = async (userEmail, creatorProfileId, message) => {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check if already restricted
  const restriction = await checkActiveRestrictions(userEmail);
  if (restriction.blocked) {
    return {
      allowed: false,
      message: restriction.message
    };
  }

  // Get recent request activity
  const recentActivity = await base44.entities.RequestActivity.filter({
    sender_email: userEmail
  });

  // Filter by time windows
  const last10Minutes = recentActivity.filter(a => 
    new Date(a.created_date) > tenMinutesAgo
  );
  const lastHour = recentActivity.filter(a => 
    new Date(a.created_date) > oneHourAgo
  );
  const lastDay = recentActivity.filter(a =>
    new Date(a.created_date) > oneDayAgo
  );

  // Check for duplicate message to same creator (resending declined/ignored)
  if (message) {
    const messageHash = hashMessage(message);
    const duplicatesToSameCreator = lastDay.filter(a => 
      a.creator_profile_id === creatorProfileId && 
      a.message_hash === messageHash
    );

    if (duplicatesToSameCreator.length >= 1) {
      // Soft flag for resending to same creator
      await base44.entities.RequestAbuseFlag.create({
        user_email: userEmail,
        flag_type: "soft_flag",
        reason: "Resending same request to same creator within 24 hours",
        request_count: duplicatesToSameCreator.length + 1,
        time_window_minutes: 1440
      });
    }
  }

  // Count requests and check for duplicates
  const requestCount10Min = last10Minutes.length;
  const requestCountHour = lastHour.length;

  // Check for near-identical messages
  let identicalCount10Min = 0;
  let identicalCountHour = 0;
  
  if (message) {
    const messageHash = hashMessage(message);
    identicalCount10Min = last10Minutes.filter(a => a.message_hash === messageHash).length;
    identicalCountHour = lastHour.filter(a => a.message_hash === messageHash).length;

    // Soft flag for 6-10 identical requests
    if (identicalCountHour >= 5 && identicalCountHour < 10) {
      await base44.entities.RequestAbuseFlag.create({
        user_email: userEmail,
        flag_type: "soft_flag",
        reason: `Sent ${identicalCountHour + 1} near-identical requests within 1 hour`,
        request_count: identicalCountHour + 1,
        time_window_minutes: 60
      });
    }

    // Rate limit for 10+ identical in 10 minutes
    if (identicalCount10Min >= 9) {
      const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
      await base44.entities.RequestAbuseFlag.create({
        user_email: userEmail,
        flag_type: "rate_limited",
        reason: `Sent ${identicalCount10Min + 1} near-identical requests within 10 minutes`,
        request_count: identicalCount10Min + 1,
        time_window_minutes: 10,
        expires_at: expiresAt.toISOString()
      });
      
      return {
        allowed: false,
        message: "You're sending requests quickly. Please wait before continuing."
      };
    }

    // Rate limit for 15+ requests in 1 hour with minimal variation (10+ identical)
    if (identicalCountHour >= 9 || requestCountHour >= 14) {
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes
      await base44.entities.RequestAbuseFlag.create({
        user_email: userEmail,
        flag_type: "rate_limited",
        reason: identicalCountHour >= 9 
          ? `Sent ${identicalCountHour + 1} near-identical requests within 1 hour`
          : `Sent ${requestCountHour + 1} requests within 1 hour`,
        request_count: Math.max(identicalCountHour + 1, requestCountHour + 1),
        time_window_minutes: 60,
        expires_at: expiresAt.toISOString()
      });
      
      return {
        allowed: false,
        message: "You're sending requests quickly. Please wait before continuing."
      };
    }
  }

  // Manual review trigger: 20+ requests in 1 hour
  if (requestCountHour >= 19) {
    await base44.entities.RequestAbuseFlag.create({
      user_email: userEmail,
      flag_type: "manual_review",
      reason: `Sent ${requestCountHour + 1} requests within 1 hour`,
      request_count: requestCountHour + 1,
      time_window_minutes: 60
    });
    
    return {
      allowed: false,
      message: "Your account is under review."
    };
  }

  // Check for repeated rate limit hits in 24 hours
  const rateLimitsLast24Hours = await base44.entities.RequestAbuseFlag.filter({
    user_email: userEmail,
    flag_type: "rate_limited"
  });
  const recentRateLimits = rateLimitsLast24Hours.filter(f => 
    new Date(f.created_date) > oneDayAgo
  );
  
  if (recentRateLimits.length >= 3) {
    await base44.entities.RequestAbuseFlag.create({
      user_email: userEmail,
      flag_type: "manual_review",
      reason: "Repeatedly hit rate limits within 24 hours",
      request_count: recentRateLimits.length,
      time_window_minutes: 1440
    });
    
    return {
      allowed: false,
      message: "Your account is under review."
    };
  }

  return { allowed: true };
};

// Track request activity
export const trackRequestActivity = async (userEmail, creatorProfileId, requestId, message, category) => {
  const messageHash = message ? hashMessage(message) : null;
  
  await base44.entities.RequestActivity.create({
    sender_email: userEmail,
    creator_profile_id: creatorProfileId,
    request_id: requestId,
    message_hash: messageHash,
    category: category
  });
};