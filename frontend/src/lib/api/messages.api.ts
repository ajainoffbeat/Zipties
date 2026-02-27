import { api } from "./client";

export const getInbox = async () => {
  const res = await api.get("/conversation/inbox");
  return res.data.data;
};

export const sendMessageApi = async (payload: {
  conversation_id: string;
  content: string;
  iv?: string;
  auth_tag?: string;
  content_type_name?: "text" | "image";
}) => {
  const res = await api.post("/conversation/message", {
    ...payload,
    content_type_name: payload.content_type_name ?? "text",
  });
  return res.data;
};

export const getConversationMessages = async (
  conversationId: string,
  limit = 20,
  offset = 0
) => {
  const res = await api.get(
    `/conversation/${conversationId}/messages`,
    {
      params: { limit, offset },
    }
  );

  return res.data.data;
};

export const getReadMessages = async (conversationId: string, messageId: string) => {
  const res = await api.post(`/conversation/read`, {
    conversation_id: conversationId,
    last_message_id: messageId,
  });
  return res.data.data;
};

export const createConversation = (userIds: string[]) => {
  return api.post("/conversation/create", {
    user_ids: userIds,
    type_name: "individual"
  });
};