import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: (userId: string) => void;
  destructive?: boolean;
  disabled?: boolean;
};

type UserDropdownProps = {
  userId: string;
  actions: UserAction[];
};

export function UserDropdownMenuTrigger({
  userId,
  actions,
}: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-25">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            disabled={action.disabled}
            onClick={() => action.onClick(userId)}
            className={cn(
              action.destructive &&
                "text-destructive focus:text-destructive cursor-pointer"
            )}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
