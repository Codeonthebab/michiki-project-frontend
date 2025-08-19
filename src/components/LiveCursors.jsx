// src/components/LiveCursors.jsx
import React, { useEffect, useRef } from "react";
import "./realtime.css";

const THROTTLE_MS = 60;

export default function LiveCursors({ planId, socket, user }) {
  const layerRef = useRef(null);
  const positionsRef = useRef(new Map());
  const rafRef = useRef(null);
  const lastSentRef = useRef(0);

  // draw cursors
  const draw = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const layer = layerRef.current;
      if (!layer) return;
      layer.innerHTML = "";
      for (const [uid, p] of positionsRef.current.entries()) {
        const el = document.createElement("div");
        el.className = "cursor-dot";
        el.style.left = `${p.x}px`;
        el.style.top = `${p.y}px`;
        el.innerHTML = `<span class="cursor-name">${p.name || "Guest"}</span>`;
        layer.appendChild(el);
      }
    });
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      const now = Date.now();
      if (now - lastSentRef.current < THROTTLE_MS) return;
      lastSentRef.current = now;
      const rect = document.body.getBoundingClientRect();
      socket?.sendMouse?.({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        userId: user?.id || "guest",
        name: user?.name || "Guest",
      });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [socket, user]);

  useEffect(() => {
    const sub = socket?.client?.subscribe?.(`/topic/plan/${planId}/mouse`, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        positionsRef.current.set(data.userId, data);
        draw();
      } catch {}
    });
    return () => sub?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, planId]);

  return <div ref={layerRef} className="cursor-layer" />;
}
