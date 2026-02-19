import { io } from "socket.io-client";
import Cookies from "js-cookie";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const tokenFromCookie = Cookies.get("token");

export const socket = io(SOCKET_URL, {
  autoConnect: !!tokenFromCookie,
  reconnection: true,
  auth: {
    token: tokenFromCookie
  },
});

export const connectSocket = (token: string) => {
  if (socket.connected) {
    socket.disconnect();
  }
  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};