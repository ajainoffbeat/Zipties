import { useState } from "react";
import { usePostStore } from "@/store/usePostStore";
import { validatePost } from "../lib/validators/postValidation";
import { useToast } from "@/components/ui/use-toast";

export function usePostComposer(files: File[]) {
  const { createPost, isCreating } = usePostStore();
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (resetFiles: () => void) => {
    const validationError = validatePost(text, files);

    if (validationError) {
      setError(validationError);

      toast({
        title: "Invalid Post",
        description: validationError,
        variant: "destructive",
      });

      return;
    }

    try {
      await createPost(text.trim(), files);

      toast({
        title: "Post created",
        description: "Your post was uploaded successfully.",
      });

      setText("");
      resetFiles();
      setError(null);

    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        "Failed to create post. Please try again.";

      setError(message);

      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return {
    text,
    setText,
    error,
    isCreating,
    submit,
  };
}