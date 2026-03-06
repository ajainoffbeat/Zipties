import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "@/lib/validators/profile.schema";
import { useProfileStore } from "@/store/useProfileStore";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
  errors: any;
};

export function BasicInfoSection({ form, errors }: Props) {
  const { profile } = useProfileStore();
  const { register } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <User className="w-5 h-5" /> Basic Information
        </CardTitle>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>First Name</Label>
          <Input {  ...register("firstName")} defaultValue={profile.first_name} />
          <p className="text-red-500 text-sm mt-1" >{errors?.firstName?.message}</p>
        </div>

        <div>
          <Label>Last Name</Label>
          <Input {...register("lastName")} defaultValue={profile.last_name} />
          <p className="text-red-500  text-sm mt-1">{errors?.lastName?.message}</p>
        </div>

        <div>
          <Label>Nickname</Label>
          <Input {...register("username")} defaultValue={profile.username} />
          <p className="text-red-500  text-sm mt-1">{errors?.username?.message}</p>
        </div>

        <div>
          <Label>Bio</Label>
          <Input {...register("bio")} defaultValue={profile.bio} />
          <p className="text-red-500  text-sm mt-1">{errors?.bio?.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}