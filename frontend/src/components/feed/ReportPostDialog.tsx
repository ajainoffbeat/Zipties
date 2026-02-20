
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReportPostDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isSubmitting: boolean;
}

export function ReportPostDialog({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
}: ReportPostDialogProps) {
    const [reason, setReason] = useState("");

    const handleSubmit = () => {
        if (reason.trim()) {
            onSubmit(reason);
            setReason("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Report Post</DialogTitle>
                    <DialogDescription>
                        Please describe why you are reporting this post.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        id="reason"
                        placeholder="Type your reason here..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="col-span-3"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!reason.trim() || isSubmitting}>
                        {isSubmitting ? "Reporting..." : "Report"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
