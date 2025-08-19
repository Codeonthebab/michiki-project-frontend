// src/utils/toLatLngObj.js
export default function toLatLngObj(latLng) {
  if (!latLng) return null;
  if (typeof latLng.lat === "function" && typeof latLng.lng === "function") {
    return { lat: latLng.lat(), lng: latLng.lng() };
  }
  if (typeof latLng.lat === "number" && typeof latLng.lng === "number") {
    return { lat: latLng.lat, lng: latLng.lng };
  }
  if (Array.isArray(latLng) && latLng.length >= 2) {
    return { lat: Number(latLng[0]), lng: Number(latLng[1]) };
  }
  if (latLng.x != null && latLng.y != null) {
    // 일부 라이브러리 포맷
    return { lat: Number(latLng.y), lng: Number(latLng.x) };
  }
  return null;
}
