import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Clock, CheckCircle2, MessageCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
    if (!authed) { setLoading(false); return; }
    const user = await base44.auth.me();
    setUserEmail(user.email);
    
    // Load requests where user is creator
    const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
    if (profiles.length > 0) {
      const reqs = await base44.entities.ContactRequest.filter(
        { creator_profile_id: profiles[0].id },
        "-created_date"
      );
      setRequests(reqs);
    }
    setLoading(false);
  };

  const markAsRead = async (req) => {
    if (req.status === "pending") {
      await base44.entities.ContactRequest.update(req.id, { status: "read" });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "read" } : r));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-neutral-300" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-800">Sign in to view requests</h2>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: "bg-blue-100 text-blue-600", label: "New" },
    read: { icon: CheckCircle2, color: "bg-neutral-100 text-neutral-600", label: "Read" },
    replied: { icon: MessageCircle, color: "bg-green-100 text-green-700", label: "Replied" },
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Requests</h1>
        <p className="text-sm text-neutral-400 mt-1">Messages from potential clients</p>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-200 animate-pulse" />
          ))
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-neutral-300" />
            </div>
            <h3 className="font-medium text-neutral-700">No requests yet</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Requests from clients will appear here
            </p>
          </div>
        ) : (
          requests.map((req) => {
            const status = statusConfig[req.status || "pending"];
            const StatusIcon = status.icon;
            return (
              <button
                key={req.id}
                onClick={() => markAsRead(req)}
                className={`w-full text-left p-4 rounded-2xl bg-white border transition-all ${
                  req.status === "pending" ? "border-blue-200 shadow-sm" : "border-neutral-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-sm font-semibold text-neutral-800 truncate">{req.sender_name}</span>
                      <Badge className={`${status.color} text-[10px] px-2`}>
                        {status.label}
                      </Badge>
                    </div>
                    {req.category && (
                      <span className="text-xs text-neutral-500">{req.category}</span>
                    )}
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{req.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <span>{req.sender_email}</span>
                      {req.preferred_date && <span>· {format(new Date(req.preferred_date), "MMM d, yyyy")}</span>}
                    </div>
                  </div>
                </div>
                {req.created_date && (
                  <div className="text-[10px] text-neutral-400 mt-2">
                    {format(new Date(req.created_date), "MMM d, yyyy 'at' HH:mm")}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}