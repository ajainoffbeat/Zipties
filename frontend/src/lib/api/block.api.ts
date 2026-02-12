import { api } from "./client";

export const blockUser = (userId: string, isBlocking: boolean = true) => {
    return api.post("/block/user", {
        user_blocked: userId,
        is_blocking: isBlocking
    });
};
