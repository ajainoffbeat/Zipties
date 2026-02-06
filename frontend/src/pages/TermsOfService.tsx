import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex bg-background p-10">
      {/* Left Content */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-2xl w-full mx-auto">
          <div
            onClick={() => navigate(-1)}
            className="cursor-pointer inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </div>

          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 2026
          </p>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using <strong>Zipties</strong>, you agree to be
                bound by these Terms of Service. If you do not agree, please do
                not use the platform.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                2. User Responsibilities
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must not misuse or abuse the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                3. Prohibited Activities
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Unauthorized access or data scraping</li>
                <li>Posting harmful, illegal, or abusive content</li>
                <li>Attempting to disrupt platform services</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                4. Account Termination
              </h2>
              <p>
                We reserve the right to suspend or terminate accounts that
                violate these terms without prior notice.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                5. Limitation of Liability
              </h2>
              <p>
                Zipties is provided “as is”. We are not liable for any damages
                resulting from the use or inability to use the platform.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-2">
                6. Changes to Terms
              </h2>
              <p>
                We may update these Terms at any time. Continued use of the
                platform indicates acceptance of the revised terms.
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 text-white">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold">Z</span>
          </div>
          <h2 className="text-3xl font-semibold mb-2">Fair & Transparent</h2>
          <p className="text-white/80">
            Clear rules to keep the community safe and trusted.
          </p>
        </div>
      </div> */}
    </div>
  );
}
