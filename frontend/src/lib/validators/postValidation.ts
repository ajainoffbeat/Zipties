export function validatePost(text: string, files: File[]) {
  if (!text.trim() && files.length === 0)
    return "Please add some text to your post.";

  if (text.length > 200)
    return "Post content must not exceed 200 characters.";

  return null;
}
