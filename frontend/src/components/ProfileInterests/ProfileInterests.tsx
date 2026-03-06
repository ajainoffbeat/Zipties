import { Badge } from "@/components/ui/badge";

export function ProfileInterests({ profile }: any) {
  if (!profile?.interests && !profile?.tags) return null;

  return (
   <>
    {(profile?.interests || profile?.tags) && (
                <div className="mt-8 pt-6 border-t border-border space-y-4">
                  {profile?.interests && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Interests:</span>
                      {profile.interests.split(',').map((interest, i) => (
                        <Badge key={i} variant="secondary" className="font-medium cursor-pointer hover:bg-secondary/80">
                          {interest.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {profile?.tags && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Skills:</span>
                      {profile.tags.split(',').map((tag, i) => (
                        <Badge key={i} variant="outline" className="font-medium cursor-pointer hover:border-primary">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
   </>
  );
}