import { api } from "./client";

export const createConversation = (userIds: string[]) => {
    return api.post("/conversation/create", {
        user_ids: userIds,
        type_name: "individual"
    });
};
