import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo2 from "@/assets/logo.png";
import { Footer } from "./Footer";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword } from "@/lib/api/auth.api";
import { toast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    const result = await forgotPassword({ email: data.email });
    if(result?.data?.message) {
     toast({
      title: "Success",
      description: result.data.message,
     });
    }
  };

  return (
    <>
      <div className="min-h-[90vh] flex">
       
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-20">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl font-bold text-foreground">Zipties</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Forgot password?</h1>
          <p className="text-gray-500 mb-8">
            No worries. We’ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Email
              </label>

              <Input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          <p className="text-sm text-gray-500 mt-6">
            Remember your password?{" "}
            <Link to="/" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-16 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl" />
          </div>

          <div className="relative text-center text-primary-foreground max-w-lg">
            <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8 animate-float">
              <img src={logo2} className="w-16 h-16" alt="Zipties logo" />
            </div>

            <h2 className="text-4xl font-bold mb-4">
              Reset Your Password
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Enter your registered email and we’ll help you get back
              into your community in no time.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
