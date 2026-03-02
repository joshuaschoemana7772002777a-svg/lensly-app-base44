import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MapPin, Globe, Instagram, Camera, Send, Flag, AlertCircle, Star, Edit3 } from "lucide-react";
import ProfileAvatar from "../components/lensly/ProfileAvatar";
import { Button } from "@/components/ui/button";
import PortfolioViewer from "../components/lensly/PortfolioViewer";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ContactFormModal from "../components/lensly/ContactFormModal";
import ReportModal from "../components/lensly/ReportModal";
import RoleSelectionModal from "../components/lensly/RoleSelectionModal";
import { checkMessagingRateLimit, trackMessagingActivity } from "../components/lensly/MessagingRateLimitCheck";
import StarRating from "../components/lensly/StarRating";
import { toast } from "sonner";

const TERMS_VERSION = "v1.0";

export default function CreatorProfile() {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [portfolioExpanded, setPortfolioExpanded] = useState(false);
  const [isPortfolioViewerOpen, setIsPortfolioViewerOpen] = useState(false);
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [showOnboardingGate, setShowOnboardingGate] = useState(false);
  const [pendingContactAction, setPendingContactAction] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const creatorId = params.get("id");
  const showSuccess = params.get("success");

  useEffect(() => {
    if (creatorId) loadCreator();
  }, [creatorId]);

  // Resume pending contact intent after login redirect
  const tryResumeIntent = async () => {
    const intent = sessionStorage.getItem("pending_intent");
    const pendingCreatorId = sessionStorage.getItem("pending_creatorId");
    if (intent === "contact_creator" && pendingCreatorId === creatorId) {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        const user = await base44.auth.me();
        const needsTerms = !user.termsAcceptedAt || user.termsVersion !== TERMS_VERSION;
        const needsRole = !user.role || (user.role !== "client" && user.role !== "creator");
        if (needsTerms || needsRole) {
          // Show onboarding gate, then proceed to contact after
          setPendingContactAction("open_form");
          setShowOnboardingGate(true);
          return;
        }
        sessionStorage.removeItem("pending_intent");
        sessionStorage.removeItem("pending_creatorId");
        setContactOpen(true);
      }
    }
  };

  useEffect(() => {
    if (creatorId) tryResumeIntent();
    // Also listen for role being selected post-login
    window.addEventListener("lensly:roleSelected", tryResumeIntent);
    return () => window.removeEventListener("lensly:roleSelected", tryResumeIntent);
  }, [creatorId]);

  useEffect(() => {
    if (showSuccess === "true") {
      toast.success("Your profile is live 🎉");
      // Remove success param from URL
      window.history.replaceState({}, '', createPageUrl("CreatorProfile") + `?id=${creatorId}`);
    }
  }, [showSuccess]);

  const loadCreator = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CreatorProfile.filter({ id: creatorId });
      if (data.length > 0) setCreator(data[0]);
      
      // Load reviews
      const creatorReviews = await base44.entities.Review.filter({ 
        creator_profile_id: creatorId 
      }, "-created_date");
      setReviews(creatorReviews);
      setReviewCount(creatorReviews.length);
      if (creatorReviews.length > 0) {
        const avgRating = creatorReviews.reduce((sum, r) => sum + r.rating, 0) / creatorReviews.length;
        setAverageRating(avgRating);
      }
      
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        const user = await base44.auth.me();
        const favs = await base44.entities.Favourite.filter({ creator_profile_id: creatorId });
        setIsFavourite(favs.length > 0);
        
        // Check if blocked
        const blocks = await base44.entities.BlockedUser.filter({
          blocker_email: user.email,
          blocked_profile_id: creatorId,
        });
        setIsBlocked(blocks.length > 0);
        
        // Check if owner
        if (data.length > 0 && data[0].created_by === user.email) {
          setIsOwner(true);
        }
      }
    } catch (error) {
      console.error("Error loading creator profile:", error);
    }
    setLoading(false);
  };

  const toggleFavourite = async () => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (isFavourite) {
      const favs = await base44.entities.Favourite.filter({ creator_profile_id: creatorId });
      if (favs.length > 0) await base44.entities.Favourite.delete(favs[0].id);
      setIsFavourite(false);
    } else {
      await base44.entities.Favourite.create({
        creator_profile_id: creator.id,
        creator_name: creator.display_name,
        creator_image: creator.profile_image,
      });
      setIsFavourite(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-5">
        <h2 className="text-lg font-semibold">Creator not found</h2>
        <Link to={createPageUrl("Discover")} className="text-blue-500 text-sm">
          Back to Discover
        </Link>
      </div>
    );
  }

  const heroImage = creator.publishedCoverPhotoUrl || creator.profile_image || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80";
  const featuredCategories = creator.featured_categories?.slice(0, 2) || creator.categories?.slice(0, 2) || [];

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Hero Cover */}
      <div className="relative aspect-[4/5] md:aspect-[16/9] max-h-[500px] bg-neutral-900">
        <img
          src={heroImage}
          alt={creator.display_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <Link
            to={createPageUrl("Discover")}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex gap-2">
            {isOwner && (
              <Link
                to={createPageUrl("EditProfile")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-neutral-700" />
                <span className="text-xs font-medium text-neutral-700">Edit Profile</span>
              </Link>
            )}
            {!isOwner && (
              <>
                <button
                  onClick={toggleFavourite}
                  className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                >
                  <Heart className={`w-4 h-4 ${isFavourite ? "fill-red-500 text-red-500" : "text-white"}`} />
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Flag className="w-4 h-4 text-white" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-3 mb-3">
            <ProfileAvatar 
              photoUrl={creator.profile_photo}
              displayName={creator.display_name}
              size="md"
              className="border-2 border-white shadow-lg"
            />
            <h1 className="text-3xl font-bold text-white leading-tight">{creator.display_name}</h1>
          </div>
          
          {featuredCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {featuredCategories.map((cat) => (
                <span key={cat} className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-sm font-medium text-neutral-900">
                  {cat}
                </span>
              ))}
            </div>
          )}
          
          {creator.starting_price && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500 backdrop-blur-sm">
              <span className="text-white text-base font-semibold">From R{creator.starting_price?.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-6">
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-neutral-100">
          {averageRating > 0 && (
            <div className="mb-4">
              <StarRating rating={averageRating} count={reviewCount} size="md" />
            </div>
          )}

          {/* Areas */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span>Operates in: {(creator.service_areas || []).join(" · ")}</span>
            </div>
          </div>

          {/* Primary CTA */}
          {rateLimitError && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{rateLimitError}</p>
            </div>
          )}

          {!isBlocked ? (
            <Button
              onClick={async () => {
                setRateLimitError(null);
                const authed = await base44.auth.isAuthenticated();
                if (!authed) {
                  sessionStorage.setItem("pending_intent", "contact_creator");
                  sessionStorage.setItem("pending_creatorId", creator.id);
                  base44.auth.redirectToLogin(window.location.href);
                  return;
                }

                const user = await base44.auth.me();
                const needsTerms = !user.termsAcceptedAt || user.termsVersion !== TERMS_VERSION;
                const needsRole = !user.role || (user.role !== "client" && user.role !== "creator");

                if (needsTerms || needsRole) {
                  setPendingContactAction("open_form");
                  setShowOnboardingGate(true);
                  return;
                }

                // Check if user has sent a request to this creator
                const sentRequests = await base44.entities.ContactRequest.filter({
                  creator_profile_id: creator.id,
                  sender_email: user.email,
                });

                if (sentRequests.length === 0) {
                  setContactOpen(true);
                  return;
                }

                const acceptedOrMessaged = sentRequests.find(r => r.status === "accepted" || r.status === "messaged");
                if (!acceptedOrMessaged) {
                  window.location.href = createPageUrl("Messages");
                  return;
                }

                const existingConvos = await base44.entities.Conversation.filter({
                  creator_profile_id: creator.id,
                  client_email: user.email,
                });

                if (existingConvos.length > 0) {
                  window.location.href = createPageUrl("Conversation") + `?id=${existingConvos[0].id}`;
                } else {
                  window.location.href = createPageUrl("Messages");
                }
              }}
              className="w-full h-14 mt-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base shadow-lg"
            >
              <Send className="w-5 h-5 mr-2" />
              Contact {creator.display_name?.split(" ")[0]}
            </Button>
          ) : (
            <div className="mt-5 p-4 bg-neutral-100 rounded-xl text-center">
              <p className="text-sm text-neutral-600">You have blocked this creator</p>
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="mt-5 bg-white rounded-2xl shadow-sm p-5 border border-neutral-100">
          {/* Categories */}
          {creator.categories?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {creator.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="bg-neutral-100 text-neutral-700 text-xs rounded-full px-3">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Portfolio — Photos */}
        {(() => {
          const allItems = creator.portfolio_items || [];
          const photos = allItems.filter(i => i.type === "image");
          const videos = allItems.filter(i => i.type === "video");

          const renderGrid = (section, sectionItems) => {
            const preview = sectionItems.slice(0, 6);
            const rest = sectionItems.slice(6);
            const isVideo = section === "video";
            return (
              <div className="mt-6">
                <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                  {isVideo ? "Videos" : "Photos"}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {preview.map((item, i) => {
                    const globalIndex = allItems.indexOf(item);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => {
                          setActivePortfolioIndex(globalIndex);
                          setIsPortfolioViewerOpen(true);
                        }}
                        className={`rounded-xl overflow-hidden cursor-pointer ${i === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}
                      >
                        {isVideo ? (
                          <div className="relative w-full h-full bg-neutral-900">
                            {item.thumbnail_url ? (
                              <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : null}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                <div className="w-0 h-0 border-l-[10px] border-l-black border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img src={item.url} alt={item.caption || ""} className="w-full h-full object-cover" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                {rest.length > 0 && (
                  <Button
                    onClick={() => {
                      setActivePortfolioIndex(allItems.indexOf(sectionItems[6]));
                      setIsPortfolioViewerOpen(true);
                    }}
                    variant="outline"
                    className="w-full mt-3 rounded-xl"
                  >
                    View {rest.length} more {isVideo ? "video" : "photo"}{rest.length !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            );
          };

          return (
            <>
              {photos.length > 0 && renderGrid("image", photos)}
              {videos.length > 0 && renderGrid("video", videos)}
            </>
          );
        })()}

        {/* Bio */}
        {creator.bio && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-5 border border-neutral-100">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{creator.bio}</p>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-5 border border-neutral-100">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">
              Reviews ({reviewCount})
            </h3>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ProfileAvatar 
                        photoUrl={null}
                        displayName={review.client_name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {review.client_name?.split(" ")[0]} {review.client_name?.split(" ")[1]?.charAt(0)}.
                        </p>
                        <p className="text-xs text-neutral-400">
                          {new Date(review.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-neutral-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-neutral-600 leading-relaxed mt-2">
                      {review.review_text}
                    </p>
                  )}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        // Report review functionality
                        setReportOpen(true);
                      }}
                      className="text-xs text-neutral-400 hover:text-neutral-600 mt-2"
                    >
                      Report review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(creator.instagram_handle || creator.website_url) && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm p-5 border border-neutral-100">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Connect</h3>
            <div className="flex flex-wrap gap-3">
              {creator.instagram_handle && (
                <a
                  href={`https://instagram.com/${creator.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-200 transition"
                >
                  <Instagram className="w-3.5 h-3.5" /> @{creator.instagram_handle}
                </a>
              )}
              {creator.website_url && (
                <a
                  href={creator.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-200 transition"
                >
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>



      <ContactFormModal open={contactOpen} onClose={() => setContactOpen(false)} creator={creator} />
      <ReportModal 
        open={reportOpen} 
        onClose={() => setReportOpen(false)} 
        reportedUserEmail={creator?.created_by}
        reportedProfileId={creator?.id}
      />

      <PortfolioViewer
        isOpen={isPortfolioViewerOpen}
        onClose={() => setIsPortfolioViewerOpen(false)}
        portfolio={creator?.portfolio_items || []}
        initialIndex={activePortfolioIndex}
      />
      </div>
      );
      }