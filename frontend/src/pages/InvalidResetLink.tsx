import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function InvalidResetLink() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon / Image */}
        <div className="flex justify-center">
          <div className="h-20 w-20 flex items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground">
          Invalid or Expired Link
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed">
          The password reset link you’re trying to use is either invalid or has
          already expired. For security reasons, reset links are only valid for
          a limited time.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/forgot-password">
            <Button type="submit"
              variant="hero"
              size="lg"
              className="w-full">
              Request New Reset Link
            </Button>
          </Link>

          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
