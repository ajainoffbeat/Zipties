import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  profile: any;
}

export function ProfileAvatar({ profile }: Props) {
  return (
    <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
      <AvatarImage src={profile?.profile_image_url} />

      <AvatarFallback className="bg-primary/5 text-primary text-2xl md:text-4xl font-bold">
        {profile?.first_name?.[0]}
        {profile?.last_name?.[0]}
      </AvatarFallback>
    </Avatar>
  );
}