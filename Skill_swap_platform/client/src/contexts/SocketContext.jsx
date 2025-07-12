import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io("http://localhost:5000");

      newSocket.on("connect", () => {
        console.log("Connected to server");
        newSocket.emit("user-connected", user.id);
      });

      newSocket.on("new-request", (request) => {
        toast.info(`New skill swap request from ${request.fromUser.name}!`);
      });

      newSocket.on("request-updated", (request) => {
        const status = request.status.toLowerCase();
        toast.info(`Your request has been ${status}!`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
