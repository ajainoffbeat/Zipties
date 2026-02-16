import LegalPage from "./LegalPage";
import { termsAndConditionsContent } from "@/lib/legalContent";

export default function TermsAndConditions() {
  return <LegalPage {...termsAndConditionsContent} />;
}
