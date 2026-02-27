import { formatDistanceToNow } from "date-fns";

export function formatCommentTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours =
      (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }

    if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
      });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "some time ago";
  }
}


export function formatPostDate(
  dateString: string | Date,
  locale: string = "en-US"
): string {
  try {
    const date =
      typeof dateString === "string"
        ? new Date(dateString)
        : dateString;

    if (isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}