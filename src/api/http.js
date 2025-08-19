// src/api/http.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/,'') || "http://localhost:8080";

const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");
const setAccessToken = (t) => localStorage.setItem("accessToken", t);
const setRefreshToken = (t) => localStorage.setItem("refreshToken", t);

function emitToast(message, type = "error") {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type } }));
    }
  } catch {}
}

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error);
    else {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      resolve(http(config));
    }
  });
  pendingQueue = [];
};

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err?.response?.status;

    if (status !== 401 || original?._retry) {
      emitToast(err?.response?.data?.message || "요청에 실패했습니다.", "error");
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => pendingQueue.push({ resolve, reject, config: original }));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const rt = getRefreshToken();
      if (!rt) throw err;

      const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh-token`, null, {
        headers: { Authorization: `Bearer ${rt}` },
      });

      const { accessToken, refreshToken } = refreshRes.data || {};
      if (accessToken) setAccessToken(accessToken);
      if (refreshToken) setRefreshToken(refreshToken);

      processQueue(null, accessToken);
      isRefreshing = false;

      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${accessToken}`;
      return http(original);
    } catch (e) {
      processQueue(e, null);
      isRefreshing = false;
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      } catch {}
      emitToast("인증이 만료되었습니다. 다시 로그인 해주세요.", "error");
      return Promise.reject(e);
    }
  }
);

export { http, API_BASE_URL, getAccessToken };
export default http;
