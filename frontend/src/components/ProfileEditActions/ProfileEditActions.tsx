import { Button } from "../ui/button";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
    isSubmitting: boolean;
};

export function ProfileActions({ isSubmitting }: Props) {
    const navigate = useNavigate();
    return (
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
                variant="subtle"
                onClick={() => navigate("/profile")}
                className="flex-1"
            >
                Cancel
            </Button>
        </div>
    );
}