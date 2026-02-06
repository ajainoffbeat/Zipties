// Socket.IO Event Types
export interface ServerToClientEvents {
  new_message: (payload: NewMessagePayload) => void;
  message_read: (payload: MessageReadPayload) => void;
  user_typing: (payload: TypingPayload) => void;
  conversation_updated: (payload: ConversationUpdatedPayload) => void;
}

export interface ClientToServerEvents {
  authenticate: (token: string) => void;
  typing: (payload: TypingPayload) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}

// Payload Types
export interface NewMessagePayload {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  content_type: string;
  created_at: string;
}

export interface MessageReadPayload {
  conversation_id: string;
  user_id: string;
  last_read_message_id: string;
}

export interface TypingPayload {
  conversation_id: string;
  user_id: string;
  username: string;
  is_typing: boolean;
}

export interface ConversationUpdatedPayload {
  conversation_id: string;
  last_message_at: string;
}

// REST API Types
export interface CreateConversationRequest {
  user_ids: string[];
  type_name?: 'individual' | 'group';
  source_type_name?: string;
  source_id?: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  content_type_name?: 'text' | 'image';
}

export interface MarkReadRequest {
  conversation_id: string;
  last_message_id: string;
}

export interface GetMessagesQuery {
  limit?: number;
  offset?: number;
}

// Response Types
export interface ConversationResponse {
  conversation_id: string;
  title: string;
  type_name: string;
  created_at: string;
}

export interface MessageResponse {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  content_type: string;
  created_at: string;
}

export interface InboxItem {
  conversation_id: string;
  title: string;
  type_name: string;
  unread_count: number;
  last_message_content: string;
  last_message_at: string;
  last_message_sender_id: string;
  last_message_sender_name: string;
  source_type: string | null;
  source_id: string | null;
}
