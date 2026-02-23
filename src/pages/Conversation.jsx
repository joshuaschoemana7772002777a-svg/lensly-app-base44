import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";

export default function Conversation() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const messagesEndRef = useRef(null);

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

    const msgs = await base44.entities.Message.filter({ conversation_id: conversationId });
    msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(msgs);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
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

    // Create notification for recipient
    const recipientEmail = userRole === "creator" ? conversation.client_email : conversation.created_by;
    const recipientIsCreator = userRole !== "creator";
    
    await base44.entities.Notification.create({
      recipient_email: recipientIsCreator ? recipientEmail : conversation.client_email,
      type: "message_new",
      title: "New Message",
      message: recipientIsCreator 
        ? `${conversation.client_name} sent you a message`
        : `${conversation.creator_name} replied to your message`,
      link_url: createPageUrl("Conversation") + `?id=${conversationId}`,
      related_id: conversationId,
      sender_name: user.full_name,
    });

    setNewMessage("");
    await loadConversation();
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
            <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0">
              {otherPersonImage ? (
                <img src={otherPersonImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-neutral-900 truncate">{otherPersonName || "User"}</h2>
            </div>
          </div>
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

      <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
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
    </div>
  );
}