import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to={createPageUrl("Home")}
            className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Community Guidelines</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-8 pb-24">
        <div className="prose prose-sm max-w-none">
          <p className="text-neutral-700 leading-relaxed mb-6 text-base">
            Lensly is built on trust, respect, and professionalism. All users must follow these guidelines 
            to keep the Platform safe.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">1. Respectful Behaviour</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              You must not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Harass, threaten, or abuse others</li>
              <li>Discriminate or use hate speech</li>
              <li>Impersonate another person or business</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">2. Content Rules</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              You may not upload or share:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Illegal or harmful content</li>
              <li>Explicit or pornographic material</li>
              <li>Content involving minors</li>
              <li>False, misleading, or deceptive information</li>
              <li>Content you do not own or have permission to use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">3. Messaging Rules</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Messaging is for legitimate service-related communication only.
            </p>
            <p className="text-neutral-700 leading-relaxed mb-3 font-semibold">
              No:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Spam or mass unsolicited messages</li>
              <li>Scams or payment redirection</li>
              <li>Requests for illegal services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">4. Safety</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Creators display operating areas only — exact locations should not be shared publicly.
            </p>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Lensly encourages users to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Meet in safe or public locations</li>
              <li>Use written agreements where appropriate</li>
              <li>Report suspicious behaviour</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">5. Reporting & Enforcement</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Users can:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Report users</li>
              <li>Report messages</li>
              <li>Block users</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4 mb-3">
              Lensly may:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Remove content</li>
              <li>Suspend or terminate accounts</li>
              <li>Restrict platform access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">6. Reviews</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              Reviews must be honest and based on real experiences.
            </p>
            <p className="text-neutral-700 leading-relaxed">
              Fake, abusive, or retaliatory reviews are prohibited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">7. Contact & Violations</h2>
            <p className="text-neutral-700 leading-relaxed">
              If you have questions about these guidelines or wish to report a violation, please contact us at:
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              <strong>Email:</strong> support@getlenslyapp.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}