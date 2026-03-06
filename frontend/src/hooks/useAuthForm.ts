import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/useProfileStore";
import { AuthFormValues } from "@/lib/validators/auth.schema";

export function useAuthForm() {
  const navigate = useNavigate();
  const { loginMutation, signupMutation } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) navigate("/feed");
  }, [navigate]);

  const toggleMode = (setValue: any, clearErrors: any) => {
    const nextMode = isLogin ? "signup" : "login";
    setIsLogin(!isLogin);
    setValue("mode", nextMode);
    clearErrors();
  };

  const handleAuthSuccess = async (token: string) => {
    useAuthStore.getState().setToken(token);
    const userId = useAuthStore.getState().userId;

    if (userId) {
      await useProfileStore.getState().fetchMyProfile(userId);
    }

    navigate("/feed");
  };

  const onSubmit = async (data: AuthFormValues) => {
    try {
      const { confirmPassword, ...payload } = data;

      const mutation =
        payload.mode === "login"
          ? loginMutation
          : signupMutation;

      const response = await mutation.mutateAsync(payload);

      if (response.data.success) {
        await handleAuthSuccess(response.data.token);
      } else {
        toast({
          title: payload.mode === "login" ? "Login Failed" : "Sign Up Failed",
          description: response.data.message,
        });
      }
    } catch (err: any) {
      toast({
        title: "Authentication Failed",
        description:
          err.response?.data?.error || "Something went wrong",
      });
    }
  };

  return {
    isLogin,
    rememberMe,
    setRememberMe,
    toggleMode,
    onSubmit,
    loginPending: loginMutation.isPending,
    signupPending: signupMutation.isPending,
  };
}