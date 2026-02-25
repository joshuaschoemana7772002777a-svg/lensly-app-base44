import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
          <h1 className="text-lg font-semibold text-neutral-900">Terms & Conditions</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-8 pb-24">
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-neutral-500 mb-6">Last updated: February 25, 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              By accessing and using Lensly ("the Platform"), you accept and agree to be bound by these Terms & Conditions. 
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">2. Description of Service</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Lensly is a platform that connects clients with photographers and videographers ("Creators"). 
              The Platform facilitates communication, booking requests, and portfolio discovery. Lensly does not provide photography 
              or videography services directly and is not responsible for the quality, delivery, or outcome of services provided by Creators.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">3. User Accounts</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. 
              You agree to provide accurate and complete information when creating an account and to update it as necessary.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">4. User Conduct</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              You agree not to use the Platform to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload false, misleading, or inappropriate content</li>
              <li>Spam or send unsolicited messages</li>
              <li>Impersonate another person or entity</li>
              <li>Interfere with the proper functioning of the Platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">5. Creator Responsibilities</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Creators are independent contractors and are solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>The accuracy of their profile information and portfolio</li>
              <li>Communicating pricing, availability, and service terms with clients</li>
              <li>Delivering services as agreed with clients</li>
              <li>Complying with all applicable laws, including tax obligations</li>
              <li>Maintaining appropriate insurance and licenses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">6. Client Responsibilities</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Clients are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Providing accurate information in booking requests</li>
              <li>Communicating clearly with Creators</li>
              <li>Honoring agreed-upon terms with Creators</li>
              <li>Conducting due diligence before hiring a Creator</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">7. Content and Intellectual Property</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Users retain ownership of the content they upload to the Platform. By uploading content, you grant Lensly a non-exclusive, 
              worldwide, royalty-free license to use, display, and distribute your content solely for the purpose of operating the Platform.
            </p>
            <p className="text-neutral-700 leading-relaxed mb-4">
              You represent and warrant that you own or have the necessary rights to all content you upload and that such content does not 
              infringe on the intellectual property rights of any third party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">8. Payment and Fees</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              All payments for services are made directly between clients and Creators. Lensly is not involved in payment processing or 
              fee collection between users. Any disputes regarding payment must be resolved directly between the parties involved.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">9. Dispute Resolution</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Lensly is not responsible for disputes between users. We encourage users to communicate directly and resolve issues amicably. 
              If you have a concern about another user's conduct, you may report it through the Platform's reporting features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              To the fullest extent permitted by law, Lensly and its affiliates, officers, directors, employees, and agents shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or goodwill</li>
              <li>Services provided by Creators</li>
              <li>Disputes between users</li>
              <li>Unauthorized access to user accounts or data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">11. Termination</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Lensly reserves the right to suspend or terminate your account at any time for violations of these Terms, at our sole discretion. 
              You may also terminate your account at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">12. Changes to Terms</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              We may update these Terms & Conditions from time to time. Changes will be posted on this page with an updated "Last updated" date. 
              Your continued use of the Platform after changes are posted constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">13. Governing Law</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              These Terms & Conditions are governed by and construed in accordance with the laws of South Africa. 
              Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of South Africa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">14. Contact Us</h2>
            <p className="text-neutral-700 leading-relaxed mb-4">
              If you have any questions or concerns about these Terms & Conditions, please contact us at:
            </p>
            <p className="text-neutral-700 leading-relaxed">
              <strong>Email:</strong> support@getlenslyapp.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}