import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Loader2, Flag, MoreVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import moment from "moment";
import ReportModal from "../components/lensly/ReportModal";
import ProfileAvatar from "../components/lensly/ProfileAvatar";
import { checkMessagingRateLimit, trackMessagingActivity } from "../components/lensly/MessagingRateLimitCheck";
import { createNotification } from "../components/lensly/NotificationService";
import ReviewModal from "../components/lensly/ReviewModal";

export default function Conversation() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const messagesEndRef = useRef(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportedEmail, setReportedEmail] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [replyTimeText, setReplyTimeText] = useState(null);
  const [otherPersonPhoto, setOtherPersonPhoto] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const conversationId = params.get("id");

  useEffect(() => {
    if (conversationId) loadConversation();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const convos = await base44.entities.Conversation.filter({ id: conversationId });
    if (convos.length === 0) {
      setLoading(false);
      return;
    }

    const convo = convos[0];
    setConversation(convo);

    const profiles = await base44.entities.CreatorProfile.filter({ created_by: currentUser.email });
    const isCreator = profiles.length > 0 && profiles[0].is_published && convo.creator_profile_id === profiles[0].id;
    setUserRole(isCreator ? "creator" : "client");
    
    // Load other person's profile photo
    if (isCreator) {
      // Load client photo from User entity
      const clientUsers = await base44.entities.User.filter({ email: convo.client_email });
      if (clientUsers.length > 0 && clientUsers[0].profile_photo_url) {
        setOtherPersonPhoto(clientUsers[0].profile_photo_url);
      }
    } else {
      // Use cached creator photo from conversation
      setOtherPersonPhoto(convo.creator_image);
    }

    // Check if client can review (conversation closed, no existing review)
    if (!isCreator && convo.status === "closed") {
      const existingReviews = await base44.entities.Review.filter({
        conversation_id: conversationId,
        client_email: currentUser.email,
      });
      setCanReview(existingReviews.length === 0);
    }
    
    // Check if blocked
    const otherEmail = isCreator ? convo.client_email : convo.created_by;
    const blocks = await base44.entities.BlockedUser.filter({
      blocker_email: currentUser.email,
      blocked_email: otherEmail,
    });
    setIsBlocked(blocks.length > 0);

    const msgs = await base44.entities.Message.filter({ conversation_id: conversationId });
    msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(msgs);

    // Calculate reply time for clients viewing creator conversations
    if (!isCreator && msgs.length > 1) {
      calculateReplyTime(msgs, convo);
    }

    const unreadField = isCreator ? "unread_count_creator" : "unread_count_client";
    if (convo[unreadField] > 0) {
      await base44.entities.Conversation.update(conversationId, { [unreadField]: 0 });
      const unreadMessages = msgs.filter(m => !m.is_read && m.sender_email !== currentUser.email);
      for (const msg of unreadMessages) {
        await base44.entities.Message.update(msg.id, { is_read: true });
      }
    }

    setLoading(false);
  };

  const calculateReplyTime = (msgs, convo) => {
    const creatorEmail = convo.created_by;
    const clientEmail = convo.client_email;
    
    // Find reply pairs (client message followed by creator reply)
    const replyTimes = [];
    for (let i = 0; i < msgs.length - 1; i++) {
      const currentMsg = msgs[i];
      const nextMsg = msgs[i + 1];
      
      // Check if client sent message and creator replied
      if (currentMsg.sender_email === clientEmail && nextMsg.sender_email === creatorEmail) {
        const replyTime = new Date(nextMsg.created_date) - new Date(currentMsg.created_date);
        replyTimes.push(replyTime);
      }
    }
    
    // Need at least 3 replies for meaningful data
    if (replyTimes.length < 3) {
      return;
    }
    
    // Use last 20 replies
    const recentReplies = replyTimes.slice(-20);
    const avgReplyTime = recentReplies.reduce((sum, time) => sum + time, 0) / recentReplies.length;
    
    // Convert to hours
    const avgHours = avgReplyTime / (1000 * 60 * 60);
    
    // Check if creator is inactive (last reply > 7 days ago)
    const lastCreatorMsg = [...msgs].reverse().find(m => m.sender_email === creatorEmail);
    if (lastCreatorMsg) {
      const daysSinceLastReply = (Date.now() - new Date(lastCreatorMsg.created_date)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastReply > 7) {
        return;
      }
    }
    
    // Set friendly text
    if (avgHours < 1) {
      setReplyTimeText("Usually replies in under 1 hour");
    } else if (avgHours < 3) {
      setReplyTimeText("Usually replies within a few hours");
    } else if (avgHours < 12) {
      setReplyTimeText("Usually replies within a few hours");
    } else if (avgHours < 24) {
      setReplyTimeText("Usually replies within 24 hours");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setRateLimitError(null);

    try {
      // Check rate limits (only for clients messaging creators)
      if (userRole === "client") {
        const rateLimitCheck = await checkMessagingRateLimit(
          user.email,
          conversation.creator_profile_id,
          newMessage.trim()
        );

        if (!rateLimitCheck.allowed) {
          setRateLimitError(rateLimitCheck.message);
          setSending(false);
          return;
        }
      }

      const messageData = {
        conversation_id: conversationId,
        sender_email: user.email,
        sender_name: user.full_name,
        content: newMessage.trim(),
      };

      await base44.entities.Message.create(messageData);

      const otherUnreadField = userRole === "creator" ? "unread_count_client" : "unread_count_creator";
      await base44.entities.Conversation.update(conversationId, {
        last_message: newMessage.trim(),
        last_message_at: new Date().toISOString(),
        [otherUnreadField]: (conversation[otherUnreadField] || 0) + 1,
      });

      // Track messaging activity (only for clients)
      if (userRole === "client") {
        await trackMessagingActivity(
          user.email,
          conversation.creator_profile_id,
          newMessage.trim(),
          conversationId
        );
      }

      // Create notification for recipient (with throttling)
      const recipientEmail = userRole === "creator" ? conversation.client_email : conversation.created_by;
      const recipientIsCreator = userRole !== "creator";
      
      await createNotification({
        recipientEmail: recipientIsCreator ? recipientEmail : conversation.client_email,
        type: "message_new",
        title: "New Message",
        message: recipientIsCreator 
          ? `${conversation.client_name} sent you a message`
          : `${conversation.creator_name} replied to your message`,
        linkUrl: createPageUrl("Conversation") + `?id=${conversationId}`,
        relatedId: conversationId,
        senderName: user.full_name,
      });

      setNewMessage("");
      await loadConversation();
    } catch (error) {
      console.error("Error sending message:", error);
    }
    
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5">
        <h2 className="text-lg font-semibold text-neutral-800">Conversation not found</h2>
        <Link to={createPageUrl("Messages")} className="mt-4 text-blue-500 text-sm">
          Back to Messages
        </Link>
      </div>
    );
  }

  const otherPersonName = userRole === "creator" ? conversation.client_name : conversation.creator_name;
  const otherPersonImage = userRole === "creator" ? null : conversation.creator_image;
  const otherPersonEmail = userRole === "creator" ? conversation.client_email : conversation.created_by;

  const handleBlock = async () => {
    await base44.entities.BlockedUser.create({
      blocker_email: user.email,
      blocked_email: otherPersonEmail,
      blocked_profile_id: userRole === "client" ? conversation.creator_profile_id : null,
    });
    setIsBlocked(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to={createPageUrl("Messages")}
            className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <ProfileAvatar 
              photoUrl={otherPersonPhoto}
              displayName={otherPersonName}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-neutral-900 truncate">{otherPersonName || "User"}</h2>
              {userRole === "client" && replyTimeText && (
                <p className="text-xs text-neutral-400 mt-0.5">{replyTimeText}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center">
                <MoreVertical className="w-5 h-5 text-neutral-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userRole === "creator" && conversation.status !== "closed" && (
                <DropdownMenuItem onClick={async () => {
                  await base44.entities.Conversation.update(conversationId, { status: "closed" });
                  await loadConversation();
                }}>
                  <span className="w-4 h-4 mr-2">✓</span>
                  Mark as Closed
                </DropdownMenuItem>
              )}
              {userRole === "client" && canReview && (
                <DropdownMenuItem onClick={() => setReviewModalOpen(true)}>
                  <span className="w-4 h-4 mr-2">⭐</span>
                  Leave a Review
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => {
                setReportedEmail(otherPersonEmail);
                setReportOpen(true);
              }}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
              {!isBlocked && (
                <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                  <span className="w-4 h-4 mr-2">🚫</span>
                  Block User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-neutral-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_email === user.email;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "bg-blue-500 text-white" : "bg-neutral-100 text-neutral-900"} rounded-2xl px-4 py-2.5`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-xs mt-1 block ${isMe ? "text-blue-100" : "text-neutral-400"}`}>
                    {moment(msg.created_date).format("h:mm A")}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {conversation.status === "closed" && userRole === "client" && canReview && (
        <div className="sticky bottom-0 bg-blue-50 border-t border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">How was your experience?</p>
              <p className="text-xs text-blue-600">Help others by leaving a review</p>
            </div>
            <Button
              onClick={() => setReviewModalOpen(true)}
              className="rounded-xl bg-blue-500 hover:bg-blue-600"
            >
              Leave Review
            </Button>
          </div>
        </div>
      )}

      {conversation.status === "closed" && !canReview && (
        <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 p-4 text-center">
          <p className="text-sm text-neutral-600">This conversation is closed</p>
        </div>
      )}

      {conversation.status !== "closed" && !isBlocked ? (
        <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
          {rateLimitError && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{rateLimitError}</p>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 min-h-[44px] max-h-32 rounded-2xl resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="h-11 w-11 rounded-full bg-blue-500 hover:bg-blue-600 flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 p-4 text-center">
          <p className="text-sm text-neutral-600">You have blocked this user</p>
        </div>
      )}
      
      <ReportModal 
        open={reportOpen} 
        onClose={() => setReportOpen(false)} 
        reportedUserEmail={reportedEmail}
      />

      {canReview && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            loadConversation();
          }}
          conversation={conversation}
        />
      )}
    </div>
  );
}