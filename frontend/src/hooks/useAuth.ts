import { useMutation } from "@tanstack/react-query";
import { login, signup } from "@/lib/api/auth.api";
import { AuthFormValues } from "@/lib/validators/auth.schema";

export function useAuth() {
  const loginMutation = useMutation({
    mutationFn: (data: AuthFormValues) => login(data),
  });

  const signupMutation = useMutation({
    mutationFn: (data: AuthFormValues) => signup(data),
  });

  return { loginMutation, signupMutation };
}
