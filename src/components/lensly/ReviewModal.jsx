import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function ReviewModal({ open, onClose, conversation }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    const user = await base44.auth.me();

    await base44.entities.Review.create({
      conversation_id: conversation.id,
      creator_profile_id: conversation.creator_profile_id,
      creator_name: conversation.creator_name,
      client_email: user.email,
      client_name: user.full_name,
      rating,
      review_text: reviewText.trim() || null,
    });

    setSubmitting(false);
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setReviewText("");
      onClose();
    }, 2000);
  };

  const handleSkip = () => {
    setRating(0);
    setReviewText("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Thank you for your review!</h3>
            <p className="text-neutral-600 text-sm text-center max-w-xs">
              Your feedback helps others find great creators.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Rate {conversation?.creator_name}</DialogTitle>
              <DialogDescription>How was your experience?</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Star Rating */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-neutral-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-neutral-600">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              {/* Optional Review Text */}
              <div>
                <label className="text-xs text-neutral-500 mb-2 block">
                  Share more about your experience (optional)
                </label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setReviewText(e.target.value);
                    }
                  }}
                  placeholder="What did you like? How was the communication?"
                  className="rounded-xl min-h-[100px]"
                  maxLength={300}
                />
                <p className="text-xs text-neutral-400 mt-1 text-right">
                  {reviewText.length}/300
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 rounded-xl"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Review
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}