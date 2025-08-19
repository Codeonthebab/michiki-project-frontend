// src/lib/socket.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL, getAccessToken } from "../api/http";

export function connectPlanSocket(planId, { onMouse, onMessage, onConnect, onDisconnect } = {}) {
  const url = `${API_BASE_URL}/ws`;
  const headers = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const client = new Client({
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    connectHeaders: headers,
    webSocketFactory: () => new SockJS(url),
    debug: () => {}, // silence logs; set to console.log for debug
  });

  let subs = [];
  client.onConnect = () => {
    subs.push(
      client.subscribe(`/topic/plan/${planId}/mouse`, (msg) => {
        try { onMouse && onMouse(JSON.parse(msg.body)); } catch {}
      })
    );
    subs.push(
      client.subscribe(`/topic/plan/${planId}/message`, (msg) => {
        try { onMessage && onMessage(JSON.parse(msg.body)); } catch {}
      })
    );
    onConnect && onConnect();
  };

  client.onStompError = () => {};
  client.onDisconnect = () => { onDisconnect && onDisconnect(); };

  client.activate();

  function sendMouse(payload) {
    if (!client.connected) return;
    client.publish({
      destination: `/app/plan/${planId}/mouse`,
      body: JSON.stringify(payload),
      headers,
    });
  }

  function sendChat(payload) {
    if (!client.connected) return;
    client.publish({
      destination: `/app/plan/${planId}/chat`,
      body: JSON.stringify(payload),
      headers,
    });
  }

  function disconnect() {
    try {
      subs.forEach((s) => s.unsubscribe());
    } catch {}
    client.deactivate();
  }

  return { sendMouse, sendChat, disconnect, client };
}
