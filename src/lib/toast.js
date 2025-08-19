// src/lib/toast.js
export function toast(message, type = "info", duration = 3000) {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type, duration } }));
    }
  } catch {}
}
