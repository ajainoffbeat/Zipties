import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MapPin } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CityFilter } from "@/components/CityDropdown/CityFilter";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "@/lib/validators/profile.schema";
import { useProfileStore } from "@/store/useProfileStore";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
  errors: any;
};

export function InterestsLocationSection({ form, errors }: Props) {
  const { profile } = useProfileStore();
  console.log(profile);
  const { register, watch, setValue } = form;
  return (
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
            <Input {...register("interests")} defaultValue={profile.interests} placeholder="Coding, Design, Travel" />
            {errors?.interests && <p className="text-red-500">{errors.interests.message}</p>}
          </div>

          <div>
            <Label>Tags (comma separated)</Label>
            <Input {...register("tags")} defaultValue={profile.tags} placeholder="Fullstack, React, UI/UX" />
            {errors?.tags && <p className="text-red-500">{errors.tags.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Location (City)</Label>
            <CityFilter
              value={watch("cityId") || ""}
              width="w-full"
              onSelect={(city) => {
                setValue("cityId", city.id);
                setValue("cityName", city.name);
              }}
              defaultValue={profile?.city_name}
            />
            {errors.cityName && <p className="text-red-500">{errors.cityName.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}