import { useState } from "react";
import { usePostStore } from "@/store/usePostStore";
import { validatePost } from "../lib/validators/postValidation";

export function usePostComposer(files: File[]) {
  const { createPost, isCreating } = usePostStore();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (resetFiles: () => void) => {
    const validationError = validatePost(text, files);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await createPost(text.trim(), files);
      setText("");
      resetFiles();
      setError(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        "Failed to create post. Please try again."
      );
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
