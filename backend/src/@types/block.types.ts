export interface BlockUserRequest {
  user_blocked: string;
  is_blocking?: boolean; // Optional parameter, defaults to true (block)
  comment?: string; // Optional comment for blocking
}

export interface BlockUserResponse {
  block_id: string | null;
  blocked_at: string;
}
