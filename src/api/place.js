// src/api/place.js
import http from "./http";

// Some code previously called GET /plans/{planId}/places (not provided by backend)
// To be robust, we fetch plan detail then return its places.
export const listPlaces = async (planId) => {
  const res = await http.get(`/plans/${planId}`);
  const plan = res.data;
  return Array.isArray(plan?.places) ? plan.places : [];
};

export const createPlace = async (planId, dto) => {
  const res = await http.post(`/plans/${planId}/places`, dto);
  return res.data;
};

export const updatePlace = async (planId, placeId, dto) => {
  // allowed fields: name, description
  const res = await http.put(`/plans/${planId}/places/${placeId}`, dto);
  return res.data;
};

export const deletePlace = async (planId, placeId) => {
  const res = await http.delete(`/plans/${planId}/places/${placeId}`);
  return res.data;
};

export const reorderPlaces = async (planId, payload) => {
  // payload: { travelDate, places: [{ placeId, orderInDay }] }
  const res = await http.put(`/plans/${planId}/places/reorder`, payload);
  return res.data;
};

export const recommendPlaces = async (planId, dto) => {
  // dto may include query/location/cats. Backend expects a request body (POST).
  const res = await http.post(`/plans/${planId}/recommendations`, dto || {});
  return res.data;
};
