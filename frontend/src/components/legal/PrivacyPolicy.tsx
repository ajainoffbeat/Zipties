import LegalPage from "@/pages/Legal/LegalPage";
import { privacyPolicyContent } from "@/lib/utils/legalContent";

export default function PrivacyPolicy() {
  return <LegalPage {...privacyPolicyContent} />;
}
