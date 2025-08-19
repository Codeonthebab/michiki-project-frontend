// src/api/plans.js
import http from "./http";

export const listPlans = async (year) => {
  const params = year ? { year } : undefined;
  const res = await http.get("/plans", { params });
  return res.data;
};

export const createPlan = async (dto) => {
  const res = await http.post("/plans", dto);
  return res.data;
};

export const getPlan = async (planId) => {
  const res = await http.get(`/plans/${planId}`);
  return res.data;
};

export const leavePlan = async (planId) => {
  // NOTE: backend uses POST /plans/{planId} to leave
  const res = await http.post(`/plans/${planId}`);
  return res.data;
};

export const changePlanColor = async (planId, color) => {
  const res = await http.post(`/plans/${planId}/newColor`, { color });
  return res.data;
};

// (Optional) legacy name to avoid breaking imports elsewhere
export const changeColor = changePlanColor;

export const getOnlineMembers = async (planId) => {
  const res = await http.get(`/plans/${planId}/members/online-members`);
  return res.data;
};

export const getPlanByShareUri = async (shareURI) => {
  const res = await http.get(`/plans/share/${shareURI}`);
  return res.data;
};
