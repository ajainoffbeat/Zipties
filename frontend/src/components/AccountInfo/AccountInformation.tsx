import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "@/lib/validators/profile.schema";
import { useProfileStore } from "@/store/useProfileStore";
import { Calendar } from "lucide-react";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
};

export function AccountInfoSection({ form }: Props) {
  const { profile } = useProfileStore();
  return (
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

  );
}