import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { authSchema, AuthFormValues } from "@/lib/validators/auth.schema";
import { useAuthForm } from "@/hooks/useAuthForm";


export default function AuthPage() {

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const {
    isLogin,
    toggleMode,
    onSubmit,
    loginPending,
    signupPending,
  } = useAuthForm();

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      mode: "login",
      email: "",
      password: "",
      fullName: "",
      confirmPassword: "",
    },
  });


return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate>

              {!isLogin && (
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      {...register("fullName")}
                      placeholder="John Doe"
                      className="pl-10 h-12"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    {...register("email")}
                    placeholder="you@example.com"
                    className="pl-10 h-12"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label>Password</Label>
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
                    {errors.password.message}
                  </p>
                )}
              </div>

              {!isLogin && (
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              )
              }
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 ml-1 rounded border-muted-foreground text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      Remember me
                    </span>
                  </label>

                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )
              }
              {!isLogin && (
                <label className="flex justify-center items-center gap-2 text-sm text-muted-foreground ml-1">
                  <span>
                    By creating an account, you agree to our {" "}

                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              )}
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loginPending || signupPending}
              >
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
    
    
    </>
)


}