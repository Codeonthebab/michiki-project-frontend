// src/api/member.js
import http from "./http";

export const googleLogin = async (code) => {
  const res = await http.post("/member/google/login", { code });
  return res.data;
};

export const logout = async () => {
  const res = await http.post("/member/logout");
  // local cleanup is handled by caller (if needed)
  return res.data;
};

export const withdraw = async () => {
  const res = await http.post("/member/withdraw");
  return res.data;
};
