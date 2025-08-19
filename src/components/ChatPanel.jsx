// src/components/ChatPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import "./realtime.css";

export default function ChatPanel({ planId, socket, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    const sub = socket?.client?.subscribe?.(`/topic/plan/${planId}/message`, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        setMessages((prev) => [...prev, data]);
      } catch {}
    });
    return () => sub?.unsubscribe?.();
  }, [socket, planId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const payload = {
      userId: user?.id || "guest",
      name: user?.name || "Guest",
      text: text.trim(),
      ts: Date.now(),
    };
    if (!payload.text) return;
    socket?.sendChat?.(payload);
    setText("");
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-title">채팅</div>
      <div className="chat-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className="chat-item">
            <b>{m.name ?? "Guest"}</b>
            <span className="chat-time">{new Date(m.ts || Date.now()).toLocaleTimeString()}</span>
            <div className="chat-text">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder="메시지를 입력하세요" />
        <button className="chat-send-btn" onClick={send}>보내기</button>
      </div>
    </div>
  );
}
