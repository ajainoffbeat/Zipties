import LegalPage from "./LegalPage";
import { privacyPolicyContent } from "@/lib/legalContent";

export default function PrivacyPolicy() {
  return <LegalPage {...privacyPolicyContent} />;
}
