import { MapPin, Calendar } from "lucide-react";

export function ProfileStats({ profile }: any) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
      <span>
        <strong>{profile?.followers_count || 0}</strong> Followers
      </span>

      <span>
        <strong>{profile?.following_count || 0}</strong> Following
      </span>

      {profile?.city_name && (
        <span className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {profile.city_name}
        </span>
      )}

      <span className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        Joined{" "}
        {profile?.joined_date &&
          new Date(profile.joined_date).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
          })}
      </span>
    </div>
  );
}