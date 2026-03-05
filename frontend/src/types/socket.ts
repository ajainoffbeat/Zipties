export interface NewMessagePayload {
    message_id: string;
    conversation_id: string;
    sender_id: string | number;
    content: string;
    iv?: string;
    auth_tag?: string;
    created_at: string;
}

export interface SocketEvents {
    new_message: (payload: NewMessagePayload) => void;
    // Add other socket events here as needed
}


export interface City {
    id: string;
    name: string;
    state: string;
    city?: string;
}
