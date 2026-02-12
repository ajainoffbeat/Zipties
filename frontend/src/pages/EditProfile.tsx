import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User, MapPin, Calendar, Check, ChevronsUpDown, Upload } from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileSchema,
  ProfileFormValues,
} from "@/lib/validators/profile.schema";
import { getCitiesList, uploadAvatar } from "@/lib/api/auth.api";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { debounce } from "lodash";

export default function EditProfile() {
  const { profile, fetchProfile, updateProfile } = useProfileStore();
  const userId = useAuthStore(s => s.userId);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      bio: "",
      location: "",
      profileImageUrl: "",
      interests: "",
      tags: "",
      cityId: "",
      cityName: "",
    },
  });

  useEffect(() => {
    if (userId) fetchProfile(userId);
  }, [userId]);

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        profileImageUrl: profile.profile_image_url || "",
        interests: profile.interests || "",
        tags: profile.tags || "",
        cityId: profile.city_id || "",
        cityName: profile.city_name || "",
      });
      if (profile.city_name) {
        setCitySearch(profile.city_name);
      }
    }
  }, [profile, reset]);

  console.log(profile)
  const fetchCities = useCallback(
    debounce(async (search: string) => {
      console.log("search", search);
      setLoadingCities(true);
      try {
        const res = await getCitiesList(search);
        setCities(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch cities", err);
      } finally {
        setLoadingCities(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    fetchCities(citySearch);
  }, [citySearch, fetchCities]);

  const profileImageUrl = watch("profileImageUrl");
  const firstName = watch("firstName");
  const username = watch("username");
  const selectedCityId = watch("cityId");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const previewUrl = URL.createObjectURL(file);
    setValue("profileImageUrl", previewUrl);
    setSelectedFile(file);
  };

  useEffect(() => {
    console.log("profileImageUrl", profileImageUrl);
  }, [profileImageUrl]);

  const onSubmit = async (data: ProfileFormValues) => {
    console.log("data", data);
    let finalProfileImageUrl = data.profileImageUrl;

    if (selectedFile) {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      try {
        const res = await uploadAvatar(formData);
        finalProfileImageUrl = res.data.data.url;
      } catch (err) {
        console.error("Failed to upload image", err);
        setUploadingImage(false);
        return; // Stop if upload fails
      } finally {
        setUploadingImage(false);
      }
    }

    await updateProfile({ ...data, profile_image_url: finalProfileImageUrl } as any);
    navigate("/profile");
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Image */}
          <Card>
            <CardContent className="pt-6 flex gap-6 items-center">
              <div className="relative group">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-2 border-border">
                  {profileImageUrl ? (
                    <img src={profileImageUrl.startsWith('/uploads') ? `${profileImageUrl}` : profileImageUrl} className="object-cover w-full h-full" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
                      {firstName?.[0] || username?.[0] || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-full">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a high-resolution image to represent yourself.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? "Uploading..." : "Change Photo"}
                  </Button>
                  {profileImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setValue("profileImageUrl", "")}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {errors.profileImageUrl && (
                  <p className="text-sm text-destructive">
                    {errors.profileImageUrl.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                <User className="w-5 h-5" /> Basic Information
              </CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input {...register("firstName")} />
              </div>

              <div>
                <Label>Last Name</Label>
                <Input {...register("lastName")} />
              </div>

              <div>
                <Label>Username</Label>
                <Input {...register("username")} />
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Bio</Label>
                <Input {...register("bio")} />
              </div>
            </CardContent>
          </Card>

          {/* Location & Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                <MapPin className="w-5 h-5" /> Interests & Location
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Interests (comma separated)</Label>
                  <Input {...register("interests")} placeholder="Coding, Design, Travel" />
                </div>

                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input {...register("tags")} placeholder="Fullstack, React, UI/UX" />
                </div>
                <div className="space-y-2">
                  <Label>Location (City)</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                      >
                        {selectedCityId
                          ? cities.find((city) => city.id === selectedCityId)?.city || watch("cityName") || "Select city..."
                          : "Select city..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] h-[200px] overflow-y-auto p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search city..."
                          onValueChange={setCitySearch}
                          value={citySearch}
                        />
                        <CommandList>
                          {loadingCities && <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>}
                          {!loadingCities && cities.length === 0 && (
                            <CommandEmpty>No city found.</CommandEmpty>
                          )}
                          <CommandGroup>
                            {cities.map((city) => (
                              <CommandItem
                                key={city.id}
                                value={city.id.toString()}
                                onSelect={() => {
                                  setValue("cityId", city.id);
                                  setValue("location", `${city.name}, ${city.state}`);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCityId === city.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {city.name}, {city.state}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>


            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                <Calendar className="w-5 h-5" /> Account Information
              </CardTitle>
            </CardHeader>

            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{profile?.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Member Since</span>
                <p className="font-medium">
                  {profile?.joined_date
                    ? new Date(profile.joined_date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                    })
                    : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="hero"
              disabled={isSubmitting}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile")}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
