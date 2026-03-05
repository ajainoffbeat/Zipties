import { AccountInfoSection } from "@/components/AccountInfo/AccountInformation";
import { BasicInfoSection } from "@/components/BasicInfoSection/BasicInfoSection";
import { AppLayout } from "@/components/layout/AppLayout";
import { InterestsLocationSection } from "@/components/LocationSection/InterestsLocation";
import { ProfileAvatarSection } from "@/components/ProfileAvatarUpload/ProfileAvatarSection";
import { ProfileActions } from "@/components/ProfileEditActions/ProfileEditActions";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { ProfileFormValues, profileSchema } from "@/lib/validators/profile.schema";
import { useProfileStore } from "@/store/useProfileStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function EditProfilePage() { 
  const {updateProfile, loading } = useProfileStore();
  const navigate = useNavigate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });
  const { handleSubmit } = form;
  const onSubmit = async (data: ProfileFormValues) => {
    
    await updateProfile(data);
    navigate("/profile");
  };
  if (loading) return <ProfileSkeleton />;
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ProfileAvatarSection form={form} />
          <BasicInfoSection form={form} errors={form.formState.errors} />
          <InterestsLocationSection form={form} errors={form.formState.errors} />
          <AccountInfoSection form={form} />
          <ProfileActions isSubmitting={form.formState.isSubmitting} />
        </form>
      </div>
    </AppLayout>
  );
}

















// import { AppLayout } from "@/components/layout/AppLayout";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Save, User, MapPin, Calendar, Upload } from "lucide-react";
// import { useProfileStore } from "@/store/useProfileStore";
// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   profileSchema,
//   ProfileFormValues,
// } from "@/lib/validators/profile.schema";
// import { uploadAvatar } from "@/lib/api/user.api";
// import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
// import { useCitySearch } from "@/hooks/useCitySearch";
// import { CityFilter } from "./Feed/CityFilter";


// export default function EditProfile() {
//   const { profile, updateProfile, loading } = useProfileStore();
//   const navigate = useNavigate();
//   const { setSearch } = useCitySearch();
//   const {
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     setValue,
//     formState: { errors, isSubmitting },
//   } = useForm<ProfileFormValues>({
//     resolver: zodResolver(profileSchema),
//     defaultValues: {
//       firstName: "",
//       lastName: "",
//       username: "",
//       bio: "",
//       location: "",
//       profileImageUrl: "",
//       interests: "",
//       tags: "",
//       cityId: "",
//       cityName: "",
//     },
//   });

//   useEffect(() => {
//     if (profile) {
//       reset({
//         firstName: profile.first_name || "",
//         lastName: profile.last_name || "",
//         username: profile.username || "",
//         bio: profile.bio || "",
//         location: profile.city_name || "",
//         profileImageUrl: profile.profile_image_url || "",
//         interests: profile.interests || "",
//         tags: profile.tags || "",
//         cityId: profile.city_id || "",
//         cityName: profile.city_name || "",
//       });
//       if (profile.city_name) {
//         setSearch(profile.city_name);
//       }
//     }
//   }, [profile, reset]);

//   const profileImageUrl = watch("profileImageUrl");
//   const firstName = watch("firstName");
//   const username = watch("username");
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Local preview
//     const previewUrl = URL.createObjectURL(file);
//     setValue("profileImageUrl", previewUrl);
//     setSelectedFile(file);
//   };

//   const onSubmit = async (data: ProfileFormValues) => {
//     let finalProfileImageUrl = data.profileImageUrl;

//     if (selectedFile) {
//       setUploadingImage(true);
//       const formData = new FormData();
//       formData.append("avatar", selectedFile);

//       try {
//         const res = await uploadAvatar(formData);
//         finalProfileImageUrl = res.data.data.url;
//       } catch (err) {
//         console.error("Failed to upload image", err);
//         setUploadingImage(false);
//         return; // Stop if upload fails
//       } finally {
//         setUploadingImage(false);
//       }
//     }

//     await updateProfile({ ...data, profileImageUrl: finalProfileImageUrl });
//     navigate("/profile");
//   };

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   return (
//     <AppLayout>
//       {loading ? (
//         <ProfileSkeleton />
//       ) : (
//         <div className="container mx-auto px-4 py-8 max-w-4xl">
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             {/* Profile Image */}
//             <Card>
//               <CardContent className="pt-6 flex gap-6 items-center">
//                 <div className="relative group">
//                   <Avatar className="w-24 h-24 md:w-32 md:h-32 border-2 border-border">
//                     {profileImageUrl ? (
//                       <img src={profileImageUrl.startsWith('/uploads') ? `${profileImageUrl}` : profileImageUrl} className="object-cover w-full h-full" />
//                     ) : (
//                       <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
//                         {firstName?.[0] || username?.[0] || "U"}
//                       </AvatarFallback>
//                     )}
//                   </Avatar>
//                   {uploadingImage && (
//                     <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-full">
//                       <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex-1 space-y-3">
//                   <div className="space-y-1">
//                     <h3 className="font-semibold text-lg">{profile?.first_name + " " + profile?.last_name}</h3>
//                     <p className="text-sm text-muted-foreground">
//                       Upload a high-resolution image to represent yourself.
//                     </p>
//                   </div>
//                   <div className="flex flex-wrap gap-3">
//                     <input
//                       type="file"
//                       ref={fileInputRef}
//                       className="hidden"
//                       accept="image/*"
//                       onChange={handleFileChange}
//                     />
//                     <Button
//                       type="button"
//                       variant="secondary"
//                       size="sm"
//                       className="gap-2"
//                       onClick={() => fileInputRef.current?.click()}
//                       disabled={uploadingImage}
//                     >
//                       <Upload className="w-4 h-4" />
//                       {uploadingImage ? "Uploading..." : "Change Photo"}
//                     </Button>
//                   </div>
//                   {errors.profileImageUrl && (
//                     <p className="text-sm text-destructive">
//                       {errors.profileImageUrl.message}
//                     </p>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Basic Info */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex gap-2 items-center">
//                   <User className="w-5 h-5" /> Basic Information
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label>First Name</Label>
//                   <Input {...register("firstName")} />
//                 </div>

//                 <div>
//                   <Label>Last Name</Label>
//                   <Input {...register("lastName")} />
//                 </div>

//                 <div>
//                   <Label>Nickname</Label>
//                   <Input {...register("username")} />
//                 </div>

//                 <div>
//                   <Label>Bio</Label>
//                   <Input {...register("bio")} />
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Location & Links */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex gap-2 items-center">
//                   <MapPin className="w-5 h-5" /> Interests & Location
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="space-y-4">
//                 <div className="grid md:grid-cols-2 gap-4">
//                   <div>
//                     <Label>Interests (comma separated)</Label>
//                     <Input {...register("interests")} placeholder="Coding, Design, Travel" />
//                   </div>

//                   <div>
//                     <Label>Tags (comma separated)</Label>
//                     <Input {...register("tags")} placeholder="Fullstack, React, UI/UX" />
//                   </div>
//                   <div className="space-y-2">
//                     <Label>Location (City)</Label>
//                     <CityFilter
//                       value={watch("cityId")}
//                       width="w-full"
//                       onSelect={(city) => {
//                         setValue("cityId", city.id);
//                         setValue("cityName", city.name);
//                         setValue("location", `${city.name}, ${city.state}`);
//                       }}
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//             {/* Account Info */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex gap-2 items-center">
//                   <Calendar className="w-5 h-5" /> Account Information
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
//                 <div className="space-y-1">
//                   <span className="text-muted-foreground">Email</span>
//                   <p className="font-medium">{profile?.email}</p>
//                 </div>

//                 <div className="space-y-1">
//                   <span className="text-muted-foreground">Member Since</span>
//                   <p className="font-medium">
//                     {profile?.joined_date
//                       ? new Date(profile.joined_date).toLocaleDateString("en-IN", {
//                         year: "numeric",
//                         month: "long",
//                       })
//                       : ""}
//                   </p>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Actions */}
//             <div className="flex gap-3 pt-4">
//               <Button
//                 type="submit"
//                 variant="hero"
//                 disabled={isSubmitting}
//                 className="flex-1"
//               >
//                 <Save className="w-4 h-4 mr-2" />
//                 {isSubmitting ? "Saving..." : "Save Changes"}
//               </Button>

//               <Button
//                 type="button"
//                 variant="subtle"
//                 onClick={() => navigate("/profile")}
//                 className="flex-1"
//               >
//                 Cancel
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}
//     </AppLayout>
//   );
// }
