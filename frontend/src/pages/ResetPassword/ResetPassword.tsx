import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/validators/resetpassword.schema";
import { verifyResetToken, resetPassword } from "@/lib/api/auth.api";
import { toast } from "@/hooks/useToast";
import InvalidResetLink from "../InvalidResetLink";
import logo from "@/assets/logo.png";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  });

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    const verifyResult = verifyResetToken(token);
    verifyResult.then((result) => {
      setTokenValid(result.data.valid);
    });
  }, [token]);

  const onSubmit = async (data: any) => {
    const result = await resetPassword({
      token,
      password: data.password
    });

    if (result?.data?.message) {
      toast({
        title: "Success",
        description: result.data.message,
      });
      navigate("/");
    }
  };

  if (tokenValid === null) {
    return <p className="text-center mt-20">Verifying token...</p>;
  }

  if (!tokenValid) {
    return <InvalidResetLink />;
  }

  return (
    <AuthLayout
      logo={logo}
      title="Reset Your Password"
      description="Choose a strong password to secure your account"
    >
      <h1 className="text-3xl font-bold mb-2">Reset your password</h1>

      <p className="text-muted-foreground mb-6">
        Enter a new password for your account
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

        <div className="space-y-1">
          <Label>New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              className="pl-10 pr-10 h-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message as string}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="pl-10 pr-10 h-12"
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message as string}
            </p>
          )}
        </div>

        <Button type="submit"
          variant="hero"
          size="lg"
          className="w-full"
        // disabled={isSubmitting}
        >
          Update Password
        </Button>
      </form>
    </AuthLayout>
  );
}