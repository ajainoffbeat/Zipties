import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex bg-background p-10">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-2xl w-full mx-auto">
          <Link
            to="/"
            className="cursor-pointer inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 2026
          </p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="font-semibold text-lg mb-2">1. Introduction</h2>
              <p>
                At <strong>Zipties</strong>, we respect your privacy and are
                committed to protecting your personal information. This Privacy
                Policy explains how we collect, use, and safeguard your data.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                2. Information We Collect
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Full name and email address</li>
                <li>Account login credentials (encrypted)</li>
                <li>Usage data such as pages visited and actions taken</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To create and manage your account</li>
                <li>To improve our platform and user experience</li>
                <li>To communicate important updates or security notices</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">4. Data Security</h2>
              <p>
                We use industry-standard security measures to protect your data.
                However, no method of transmission over the internet is 100%
                secure.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">5. Your Rights</h2>
              <p>
                You may request access, correction, or deletion of your personal
                data at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                6. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Continued
                use of Zipties means you accept the updated policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
