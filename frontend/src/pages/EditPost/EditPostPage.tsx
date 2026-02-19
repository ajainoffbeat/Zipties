import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { usePostStore } from "@/store/usePostStore";
import { useImageHandler } from "@/hooks/useImageHandler";
import EditPostForm from "./EditPostForm";
import { useEditPost } from "@/hooks/useEditPost";

export default function EditPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { posts } = usePostStore();

  const images = useImageHandler();
  const post = useEditPost(postId);
  const isDragging = images.isDragging;

  // preload existing post images
  useEffect(() => {
    if (!postId) return;

    const existing = posts.find(p => p.postId === postId);
    if (existing) {
      const urls = [...existing.assets]
        .sort((a, b) => a.position - b.position)
        .map(a => a.url);

      images.setInitialPreviews(urls);
    }
  }, [postId, posts]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
           <EditPostForm
          content={post.content}
          setContent={post.setContent}
          images={images.previews}
          isDragging={images.isDragging}
          setIsDragging={images.setIsDragging}
          onDrop={(files) => images.readFiles(files)}
          onRemoveImage={images.remove}
          inputRef={images.inputRef}
          onPickImage={() => images.inputRef.current?.click()}
          onCancel={() => navigate("/feed")}
          loading={post.loading}
          error={post.error}
          onSubmit={() => post.submit(images.files)}
        />
      </div>
    </AppLayout>
  );
}



































// import { useEffect, useRef, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { AppLayout } from "@/components/layout/AppLayout";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { ArrowLeft, ImageIcon, Loader2, AlertCircle, X, ImagePlus } from "lucide-react";
// import { cn } from "@/lib/utils/utils";
// import { useProfileStore } from "@/store/useProfileStore";
// import { usePostStore } from "@/store/usePostStore";
// import ImagePreviewGrid from "@/components/media/ImagePreviewGrid";
// import { useImageHandler } from "@/hooks/useImageHandler";


// export default function EditPost() {
//   const { profile } = useProfileStore();
//   const { posts, getPost, editPost } = usePostStore();
//   const navigate = useNavigate();
//   const { postId } = useParams<{ postId: string }>();

//   // Form state
//   const [content, setContent] = useState("");
//   const [selectedImages, setSelectedImages] = useState<string[]>([]);
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   // const [isDragging, setIsDragging] = useState(false);
//   const  isDragging =  useImageHandler();
//   const [postError, setPostError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // Load post data on mount
//   useEffect(() => {
//     if (!postId) {
//       navigate("/feed");
//       return;
//     }

//     // Find post in existing posts first
//     const existingPost = posts.find(p => p.postId === postId);
//     if (existingPost) {
//       setContent(existingPost.content);
//       // Load existing images
//       const imageUrls = existingPost.assets
//         .sort((a, b) => a.position - b.position)
//         .map((a) => a.url);
//       setSelectedImages(imageUrls);
//     } else {
//       // Fetch post if not in store
//       loadPost();
//     }
//   }, [postId, posts, navigate]);

//   const loadPost = async () => {
//     if (!postId) return;
//     try {
//       setIsLoading(true);
//       const postData = await getPost(postId);
//       setContent(postData.content);
//       const imageUrls = postData.assets
//         .sort((a, b) => a.position - b.position)
//         .map((a) => a.url);
//       setSelectedImages(imageUrls);
//     } catch (error) {
//       setPostError("Failed to load post. Please try again.");
//       setTimeout(() => navigate("/feed"), 2000);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   /* ── Image helpers ── */
//   const readFiles = (files: FileList | File[]) => {
//     Array.from(files).forEach((file) => {
//       if (!file.type.startsWith("image/")) return;
//       setSelectedFiles((prev) => [...prev, file]);
//       const reader = new FileReader();
//       reader.onload = (ev) =>
//         setSelectedImages((prev) => [...prev, ev.target?.result as string]);
//       reader.readAsDataURL(file);
//     });
//   };

//   const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) readFiles(e.target.files);
//     e.target.value = "";
//   };

//   const handleRemoveImage = (index: number) => {
//     setSelectedImages((prev) => prev.filter((_, i) => i !== index));
//     setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
//   const handleDragLeave = () => setIsDragging(false);
//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//     if (e.dataTransfer.files) readFiles(e.dataTransfer.files);
//   };

//   /* ── Submit edit ── */
//   const handleEdit = async () => {
//     const trimmed = content.trim();
//     if (!trimmed) {
//       setPostError("Please add some text to your post.");
//       return;
//     }
//     if (trimmed.length > 200) {
//       setPostError("Post content must not exceed 200 characters.");
//       return;
//     }

//     if (!postId) return;

//     setPostError(null);
//     setIsLoading(true);
//     try {
//       await editPost(postId, trimmed, selectedFiles);
//       navigate("/feed");
//     } catch (err: any) {
//       setPostError(err?.response?.data?.message ?? "Failed to update post. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const charCount = content.length;
//   const charLimit = 200;
//   const isOverLimit = charCount > charLimit;

//   if (isLoading && !content) {
//     return (
//       <AppLayout>
//         <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
//           <div className="container mx-auto px-4 py-6 max-w-4xl">
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center">
//                 <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
//                 <p className="text-muted-foreground">Loading your post...</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout>
//       <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
//         <div className="container mx-auto px-4 py-6 max-w-4xl">
//           {/* Header */}
//           <div className="flex items-center gap-4 mb-8">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => navigate("/feed")}
//               className="shrink-0 hover:bg-muted/50 rounded-xl"
//             >
//               <ArrowLeft className="w-5 h-5" />
//             </Button>
//             <div>
//               <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
//               <p className="text-sm text-muted-foreground">Make changes to your post</p>
//             </div>
//           </div>

//           {/* Edit Post Form */}
//           <div
//             className={cn(
//               "bg-gradient-to-br from-card to-card/50 backdrop-blur-sm rounded-3xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden",
//               isDragging ? "border-primary/60 bg-primary/10 scale-[1.02]" : ""
//             )}
//             onDragOver={handleDragOver}
//             onDragLeave={handleDragLeave}
//             onDrop={handleDrop}
//           >
//             <div className="p-6">
//               <div className="flex gap-4">
//                 <Avatar className="w-12 h-12 shrink-0 ring-2 ring-primary/20">
//                   <AvatarImage src={profile?.profile_image_url} />
//                   <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-lg">
//                     {profile?.first_name?.[0]?.toUpperCase() ?? "U"}
//                   </AvatarFallback>
//                 </Avatar>

//                 <div className="flex-1 min-w-0">
//                   <textarea
//                     placeholder="Share your thoughts with the community..."
//                     value={content}
//                     onChange={(e) => { setContent(e.target.value); setPostError(null); }}
//                     className="w-full bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground/70 min-h-[120px] text-base leading-relaxed font-medium"
//                   />

//                   {/* Image previews */}
//                   <ImagePreviewGrid images={selectedImages} onRemove={handleRemoveImage} />

//                   {/* Drag hint */}
//                   {isDragging && selectedImages.length === 0 && (
//                     <div className="mt-4 border-2 border-dashed border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
//                       <ImagePlus className="w-10 h-10 text-primary animate-pulse" />
//                       <p className="text-sm font-medium text-primary">Drop images here to share</p>
//                       <p className="text-xs text-muted-foreground">Supports JPG, PNG, GIF</p>
//                     </div>
//                   )}

//                   {/* Char counter + error */}
//                   <div className="flex items-center justify-between mt-4">
//                     <div>
//                       {postError && (
//                         <p className="text-xs text-destructive flex items-center gap-1">
//                           <AlertCircle className="w-3 h-3" />
//                           {postError}
//                         </p>
//                       )}
//                     </div>
//                     {charCount > 150 && (
//                       <span className={cn("text-xs tabular-nums px-2 py-1 rounded-lg", isOverLimit ? "text-destructive bg-destructive/10 font-semibold" : "text-muted-foreground bg-muted/50")}>
//                         {charCount}/{charLimit}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Actions bar */}
//             <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
//               <div className="flex gap-2 items-center">
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   className="hidden"
//                   onChange={handleImageSelect}
//                 />
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-xl px-4 py-2"
//                   onClick={() => fileInputRef.current?.click()}
//                   disabled={isLoading}
//                 >
//                   <ImageIcon className="w-5 h-5 mr-2" />
//                   Photo
//                   {selectedImages.length > 0 && (
//                     <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
//                       {selectedImages.length}
//                     </span>
//                   )}
//                 </Button>
//               </div>
//               <div className="flex gap-3">
//                 <Button
//                   variant="outline"
//                   onClick={() => navigate("/feed")}
//                   disabled={isLoading}
//                   className="rounded-xl"
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   variant="hero"
//                   size="lg"
//                   disabled={!content.trim() || isOverLimit || isLoading}
//                   onClick={handleEdit}
//                   className="gap-2 px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
//                 >
//                   {isLoading ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     "Save Changes"
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </AppLayout>
//   );
// }
