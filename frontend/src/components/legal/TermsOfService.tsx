import LegalPage from "@/pages/Legal/LegalPage";
import { termsAndConditionsContent } from "@/lib/utils/legalContent";

export default function TermsAndConditions() {
  return <LegalPage {...termsAndConditionsContent} />;
}
