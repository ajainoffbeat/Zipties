import { io } from "socket.io-client";
import Cookies from "js-cookie";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let token = Cookies.get("token");
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  auth: {
    token
  },
});