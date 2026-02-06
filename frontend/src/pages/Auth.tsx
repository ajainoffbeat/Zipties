import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { authSchema, AuthFormValues } from "@/lib/validators/auth.schema";
import logo from "@/assets/zeptis-logo-1.png";
import logo2 from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import Cookies from "js-cookie";
import { setCookie } from "@/utils/cookies";
import { toast, useToast } from "@/hooks/use-toast";
import { Footer } from "./Footer";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { loginMutation, signupMutation } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  // const [acceptPolicy, setAcceptPolicy] = useState(false);
  // const { toasts } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      mode: "login",
      email: "",
      password: "",
      fullName: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const toggleMode = () => {
    const nextMode = isLogin ? "signup" : "login";
    setIsLogin(!isLogin);
    setValue("mode", nextMode);
    clearErrors();
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      navigate("/feed");
    }
  }, []);

  const onSubmit = async (data: AuthFormValues) => {
    try {
      const { confirmPassword, ...payload } = data;
      if (payload.mode === "login") {
        const response = await loginMutation.mutateAsync(payload);
          if(response.data.success=== true){
            setCookie("token", response.data.token);
            navigate("/feed");
          }
          else{
            toast({
              variant: "default",
              title: "Login Failed",
              description: response.data.message,
            });
          }
  
      } else {
        const response = await signupMutation.mutateAsync(payload);
          if(response.data.success=== true){
            setCookie("token", response.data.token);
            navigate("/feed");
          }
          else{
            toast({
              variant: "default",
              title: "SignIn Failed",
              description: response.data.message,
            });
          }
      }
    } catch (err: any) {
      console.log("Error", err.response?.data.error);
      toast({
        variant: "default",
        title: "Sign Up Failed",
        description: err.response?.data.error || "An error occurred",
      });
      console.error(err.message);
    }
  };

  return (
    <>
    <div className="min-h-[90vh] bg-background flex ">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 p-5">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-4">
            {
              isLogin && (
                <img src={logo} className="mb-5" alt="" />
              )
            }
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>

            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to continue"
                : "Join thousands of community members"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">

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
          
            {

              isLogin && (
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
              disabled={loginMutation.isPending || signupMutation.isPending}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-4 text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center text-primary-foreground max-w-lg">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8 animate-float">
            <img src={logo2} className="w-16 h-16" alt="" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Join the Community</h2>
          <p className="text-lg text-primary-foreground/80">
            Connect, collaborate, and build together.
          </p>
        </div>
      </div>
    </div>
    <Footer />
  </>
  );
}
