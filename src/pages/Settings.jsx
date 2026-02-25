import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Heart, Mail, User, LogOut, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import RoleSelectionModal from "../components/lensly/RoleSelectionModal";
import AccountDeletionModal from "../components/lensly/AccountDeletionModal";
import RoleSwitchConfirmModal from "../components/lensly/RoleSwitchConfirmModal";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [hasCreatorProfile, setHasCreatorProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionAction, setDeletionAction] = useState(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    const userData = await base44.auth.me();
    setUser(userData);
    
    // Check for creator profile
    const creatorProfiles = await base44.entities.CreatorProfile.filter({ created_by: userData.email });
    setHasCreatorProfile(creatorProfiles.length > 0);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="bg-white border-b border-neutral-100 px-5 py-6">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Account Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Account</h2>
          </div>
          <div className="p-4 space-y-1">
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{user?.full_name || "User"}</p>
                <p className="text-xs text-neutral-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Profile</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {!user?.role ? (
              <button
                onClick={() => {
                  setIsSwitchingRole(false);
                  setShowRoleModal(true);
                }}
                className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-neutral-900">Create Profile</p>
                  <p className="text-xs text-neutral-500">Set up how you'll use Lensly</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
            ) : user.role === "creator" ? (
              <button
                onClick={() => window.location.href = createPageUrl("EditProfile")}
                className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-neutral-900">Creator Profile</p>
                  <p className="text-xs text-neutral-500">Edit your creator profile</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
            ) : (
              <button
                onClick={() => window.location.href = createPageUrl("EditClientProfile")}
                className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-neutral-900">Client Profile</p>
                  <p className="text-xs text-neutral-500">Edit your client profile</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
            )}
            
            {/* Switch Role - only show if user has a role */}
            {user?.role && (
              <button
                onClick={() => setShowSwitchConfirm(true)}
                className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-neutral-900">Switch role</p>
                  <p className="text-xs text-neutral-500">Change how you use Lensly</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </button>
            )}
          </div>
        </div>

        {/* Legal */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Legal</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            <button
              onClick={() => window.location.href = createPageUrl("Terms")}
              className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-neutral-900">Terms & Conditions</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
            <button
              onClick={() => window.location.href = createPageUrl("Privacy")}
              className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-neutral-900">Privacy Policy</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
            <button
              onClick={() => window.location.href = createPageUrl("CommunityGuidelines")}
              className="w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-neutral-900">Community Guidelines</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <button
            onClick={() => base44.auth.logout()}
            className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600">Log Out</p>
            </div>
          </button>
        </div>

        {/* Account Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Account Management</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            <button
              onClick={() => {
                setDeletionAction("deactivate");
                setShowDeletionModal(true);
              }}
              className="w-full p-4 flex items-center gap-3 hover:bg-orange-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-orange-600">Deactivate Account</p>
                <p className="text-xs text-neutral-500">Temporarily disable your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
            <button
              onClick={() => {
                setDeletionAction("delete");
                setShowDeletionModal(true);
              }}
              className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-red-600">Delete Account Permanently</p>
                <p className="text-xs text-neutral-500">Permanently remove your account and data</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      <RoleSelectionModal 
        open={showRoleModal} 
        onClose={() => {
          setShowRoleModal(false);
          setIsSwitchingRole(false);
        }} 
        isSwitchingRole={isSwitchingRole}
      />
      <RoleSwitchConfirmModal
        open={showSwitchConfirm}
        onClose={() => setShowSwitchConfirm(false)}
        currentRole={user?.role}
        onContinue={() => {
          setShowSwitchConfirm(false);
          setIsSwitchingRole(true);
          setShowRoleModal(true);
        }}
      />
      <AccountDeletionModal 
        open={showDeletionModal} 
        onClose={() => {
          setShowDeletionModal(false);
          setDeletionAction(null);
        }}
        actionType={deletionAction}
      />
    </div>
  );
}