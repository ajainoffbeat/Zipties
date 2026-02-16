import { useInboxStore } from "@/store/useInboxStore";
import { useMessageStore } from "@/store/useMessageStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketEvent } from "./useSocketEvent";
import { formatMessageTime } from "@/utils/date";
import { NewMessagePayload } from "@/types/socket";
import { decryptMessage } from "@/lib/encryption";

/**
 * Hook to handle real-time notifications via Socket.io.
 * It listens for "new_message" events and updates the internal stores accordingly.
 */
export const useSocketNotifications = () => {
    const { incrementUnreadCount, selectedConvo, updateConversation } = useInboxStore();
    const { addMessage } = useMessageStore();
    const userId = useAuthStore((s) => s.userId);

    useSocketEvent<NewMessagePayload>("new_message", async (payload) => {
        const isFromMe = String(payload.sender_id) === String(userId);
        const isCurrentConvo = payload.conversation_id === selectedConvo?.id;
        const formattedTime = formatMessageTime(payload.created_at);

        const decryptedContent = await decryptMessage(
            payload.content,
            payload.iv || "",
            payload.auth_tag || ""
        );

        // 1. Add message to the message store ONLY if it belongs to the active conversation
        if (isCurrentConvo) {
            addMessage({
                id: payload.message_id,
                conversationId: payload.conversation_id,
                isread: isCurrentConvo,
                sender: isFromMe ? "me" : "them",
                content: decryptedContent,
                time: formattedTime,
                status: "delivered",
            });
        }

        // 2. Update conversation summary in the inbox list
        updateConversation(payload.conversation_id, {
            lastMessage: decryptedContent,
            time: formattedTime,
            lastMessageAt: payload.created_at,
        });

        // 3. Increment unread count if the message is from someone else and not in the active chat
        if (!isCurrentConvo && !isFromMe) {
            incrementUnreadCount(payload.conversation_id);
        }
    });
};
