import { io } from "socket.io-client";
import Cookies from "js-cookie";

let token = Cookies.get("token");
export const socket = io("http://localhost:5000", {
  autoConnect: true,
  reconnection: true,
  auth: {
    token
  },
});