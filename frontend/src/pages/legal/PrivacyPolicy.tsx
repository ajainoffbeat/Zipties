import LegalPage from "../LegalPage";
import { privacyPolicyContent } from "@/lib/utils/legalContent";

export default function PrivacyPolicy() {
  return <LegalPage {...privacyPolicyContent} />;
}
