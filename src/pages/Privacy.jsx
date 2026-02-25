import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
          <h1 className="text-lg font-semibold text-neutral-900">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-8 pb-24">
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-neutral-500 mb-6">Last updated: February 25, 2026</p>

          <div className="mb-8">
            <p className="text-neutral-700 leading-relaxed mb-4">
              Lensly ("we", "us", "our") respects your privacy and is committed to protecting your personal information 
              in accordance with the Protection of Personal Information Act, 4 of 2013 ("POPIA").
            </p>
            <p className="text-neutral-700 leading-relaxed mb-4">
              This Privacy Policy explains how we collect, use, store, and protect your personal information when you use 
              the Lensly app and website ("Platform").
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">1. Information We Collect</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              We may collect the following personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Name and surname</li>
              <li>Email address and/or phone number</li>
              <li>Profile photo (optional)</li>
              <li>Creator profile information (categories, portfolio content, pricing, operating areas)</li>
              <li>Messages and requests exchanged on the Platform</li>
              <li>Reviews and ratings</li>
              <li>Device and usage data (analytics, logs, crash data)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">2. How We Collect Information</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              We collect information when you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Create an account</li>
              <li>Edit your profile</li>
              <li>Upload content</li>
              <li>Send messages or requests</li>
              <li>Leave reviews</li>
              <li>Use the Platform as a client or creator</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">3. Purpose of Collection</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              We collect and process personal information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Provide and operate the Lensly Platform</li>
              <li>Enable discovery and communication between clients and creators</li>
              <li>Maintain safety, trust, and moderation</li>
              <li>Improve performance and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">4. Legal Basis for Processing (POPIA)</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              We process personal information based on:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Your consent</li>
              <li>Performance of a contract (providing the Platform)</li>
              <li>Legitimate interests (security, fraud prevention, service improvement)</li>
              <li>Legal obligations where applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">5. Sharing of Information</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              We may share information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Service providers ("operators") such as hosting, analytics, email, or support tools</li>
              <li>Law enforcement or regulators where legally required</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-3">
              We do not sell personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">6. Data Storage & Security</h2>
            <p className="text-neutral-700 leading-relaxed">
              We implement reasonable technical and organisational safeguards to protect personal information 
              against loss, misuse, or unauthorised access.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">7. Data Retention</h2>
            <p className="text-neutral-700 leading-relaxed">
              We retain personal information only for as long as necessary to fulfil the purposes outlined in this Policy, 
              unless longer retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">8. User Rights (POPIA)</h2>
            <p className="text-neutral-700 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Access your personal information</li>
              <li>Request correction or deletion</li>
              <li>Object to processing</li>
              <li>Withdraw consent (where applicable)</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-4">
              Requests can be sent to: <strong>support@getlenslyapp.com</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">9. Children</h2>
            <p className="text-neutral-700 leading-relaxed">
              Lensly is not intended for users under the age of 18.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-neutral-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Continued use of the Platform constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">11. Contact Us</h2>
            <p className="text-neutral-700 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us at:
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