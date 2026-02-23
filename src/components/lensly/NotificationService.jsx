import { base44 } from "@/api/base44Client";

const THROTTLE_WINDOWS = {
  message_new: 2 * 60 * 1000, // 2 minutes
  request_new: 5 * 60 * 1000, // 5 minutes
  request_accepted: 10 * 60 * 1000, // 10 minutes
  request_declined: 10 * 60 * 1000, // 10 minutes
};

const GROUPING_THRESHOLDS = {
  message_new: 3,
  request_new: 2,
  request_accepted: 2,
  request_declined: 2,
};

const DAILY_PUSH_LIMIT = 20;
const QUIET_HOURS_START = 22; // 10 PM
const QUIET_HOURS_END = 7; // 7 AM

// Check if current time is in quiet hours
const isQuietHours = () => {
  const hour = new Date().getHours();
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
};

// Reset daily counters if needed
const resetDailyCounters = async (throttle) => {
  const today = new Date().toISOString().split('T')[0];
  if (throttle.last_reset_date !== today) {
    await base44.entities.NotificationThrottle.update(throttle.id, {
      daily_push_count: 0,
      last_reset_date: today,
    });
    return 0;
  }
  return throttle.daily_push_count || 0;
};

// Main notification creation function with throttling
export const createNotification = async ({
  recipientEmail,
  type,
  title,
  message,
  linkUrl,
  relatedId,
  senderName,
}) => {
  const now = new Date();
  const throttleWindow = THROTTLE_WINDOWS[type] || 0;
  const groupingThreshold = GROUPING_THRESHOLDS[type] || 999;

  // Find existing throttle record
  const throttles = await base44.entities.NotificationThrottle.filter({
    recipient_email: recipientEmail,
    notification_type: type,
    related_id: relatedId || "",
  });

  let throttle = throttles[0];
  let shouldSendPush = true;
  let suppressedReason = null;

  if (throttle) {
    const lastNotificationTime = new Date(throttle.last_notification_at);
    const timeSinceLastNotification = now - lastNotificationTime;

    // Reset daily push counter if needed
    const currentDailyPushCount = await resetDailyCounters(throttle);

    // Check if within throttle window
    if (timeSinceLastNotification < throttleWindow) {
      const newSuppressedCount = (throttle.suppressed_count || 0) + 1;

      // Check if we should send a grouped notification
      if (newSuppressedCount >= groupingThreshold) {
        // Create grouped notification
        const groupedTitle = type === 'message_new' 
          ? `New messages from ${senderName}`
          : type === 'request_new'
          ? `You have ${newSuppressedCount + 1} new requests`
          : `Updates on ${newSuppressedCount + 1} requests`;

        const groupedMessage = type === 'message_new'
          ? `${senderName} sent ${newSuppressedCount + 1} messages`
          : type === 'request_new'
          ? `${newSuppressedCount + 1} clients want to work with you`
          : `${newSuppressedCount + 1} of your requests have been updated`;

        // Check push eligibility
        if (currentDailyPushCount >= DAILY_PUSH_LIMIT) {
          shouldSendPush = false;
          suppressedReason = "daily_cap";
        } else if (isQuietHours()) {
          shouldSendPush = false;
          suppressedReason = "quiet_hours";
        }

        // Create the grouped notification
        await base44.entities.Notification.create({
          recipient_email: recipientEmail,
          type,
          title: groupedTitle,
          message: groupedMessage,
          link_url: linkUrl,
          related_id: relatedId,
          sender_name: senderName,
          is_grouped: true,
          grouped_count: newSuppressedCount + 1,
          push_sent: shouldSendPush,
          suppressed_reason: suppressedReason,
        });

        // Reset suppression counter and update throttle
        await base44.entities.NotificationThrottle.update(throttle.id, {
          last_notification_at: now.toISOString(),
          suppressed_count: 0,
          daily_push_count: shouldSendPush ? currentDailyPushCount + 1 : currentDailyPushCount,
        });

        return;
      } else {
        // Still within throttle window, increment suppressed count
        await base44.entities.NotificationThrottle.update(throttle.id, {
          suppressed_count: newSuppressedCount,
        });

        // Create in-app notification but suppress push
        await base44.entities.Notification.create({
          recipient_email: recipientEmail,
          type,
          title,
          message,
          link_url: linkUrl,
          related_id: relatedId,
          sender_name: senderName,
          push_sent: false,
          suppressed_reason: "throttled",
        });

        return;
      }
    } else {
      // Outside throttle window - send normally
      // Check push eligibility
      if (currentDailyPushCount >= DAILY_PUSH_LIMIT) {
        shouldSendPush = false;
        suppressedReason = "daily_cap";
      } else if (isQuietHours()) {
        shouldSendPush = false;
        suppressedReason = "quiet_hours";
      }

      // Update throttle record
      await base44.entities.NotificationThrottle.update(throttle.id, {
        last_notification_at: now.toISOString(),
        suppressed_count: 0,
        daily_push_count: shouldSendPush ? currentDailyPushCount + 1 : currentDailyPushCount,
      });
    }
  } else {
    // First notification - create throttle record
    throttle = await base44.entities.NotificationThrottle.create({
      recipient_email: recipientEmail,
      notification_type: type,
      related_id: relatedId || "",
      last_notification_at: now.toISOString(),
      suppressed_count: 0,
      daily_push_count: 1,
      last_reset_date: now.toISOString().split('T')[0],
    });

    // Check push eligibility for first notification
    if (isQuietHours()) {
      shouldSendPush = false;
      suppressedReason = "quiet_hours";
    }
  }

  // Create the notification
  await base44.entities.Notification.create({
    recipient_email: recipientEmail,
    type,
    title,
    message,
    link_url: linkUrl,
    related_id: relatedId,
    sender_name: senderName,
    push_sent: shouldSendPush,
    suppressed_reason: suppressedReason,
  });
};