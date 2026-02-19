import { useEffect, useRef } from "react";
import { socket } from "@/lib/utils/socket";


export const useSocketEvent = <T>(
    event: string,
    handler: (payload: T) => void
) => {
    const handlerRef = useRef(handler);

    // Update the ref whenever the handler changes, 
    // so we always use the latest handler without re-attaching the listener
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        const internalHandler = (payload: T) => {
            handlerRef.current(payload);
        };

        socket.on(event, internalHandler);

        return () => {
            socket.off(event, internalHandler);
        };
    }, [event]);
};
