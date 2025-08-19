// src/pages/ScheduleMap.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader } from "@googlemaps/js-api-loader";
import { listPlaces, createPlace, updatePlace, deletePlace, recommendPlaces } from "../api/place";
import { getPlan } from "../api/plans";
import { toast } from "../lib/toast";
import "./realtime.css";

/**
 * 완전 교체용 ScheduleMap.jsx
 * - 구글 맵 로드 (VITE_GOOGLE_MAPS_API_KEY 필요)
 * - 기존 장소를 마커로 표시
 * - 마커 클릭시 정보창(수정/삭제)
 * - 맵 우클릭으로 새 장소 추가 (날짜 선택 지원)
 * - 추천 보기 토글 → 추천 마커 표시, 클릭시 바로 추가 가능
 * - 디자인: 밝은 크림 #fffdf5 배경, 버튼 #f0d8a8
 */

function formatDate(d) {
  const iso = new Date(d).toISOString();
  return iso.slice(0,10);
}
function uniqDates(places) {
  const set = new Set(places?.map(p => p.travelDate).filter(Boolean));
  if (set.size === 0) set.add(formatDate(new Date()));
  return Array.from(set).sort();
}

export default function ScheduleMap() {
  const { planId } = useParams();
  const mapRef = useRef(null);
  const map = useRef(null);
  const info = useRef(null);
  const placeMarkers = useRef([]);
  const recoMarkers = useRef([]);

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [places, setPlaces] = useState([]);
  const dateOptions = useMemo(() => uniqDates(places), [places]);
  const [targetDate, setTargetDate] = useState(null);
  const [showReco, setShowReco] = useState(false);

  useEffect(() => {
    if (dateOptions.length > 0 && !targetDate) setTargetDate(dateOptions[0]);
  }, [dateOptions, targetDate]);

  const refresh = async () => {
    setLoading(true);
    try {
      const p = await getPlan(planId);
      setPlan(p);
      const ps = await listPlaces(planId);
      setPlaces(ps);
      return { p, ps };
    } catch (e) {
      toast("지도를 불러오지 못했습니다.", "error");
      return {};
    } finally {
      setLoading(false);
    }
  };

  // load google map once
  useEffect(() => {
    let cancelled = false;
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places"],
    });
    (async () => {
      try {
        await loader.load();
        if (cancelled) return;
        map.current = new google.maps.Map(mapRef.current, {
          center: { lat: 35.681236, lng: 139.767125 }, // Tokyo Station
          zoom: 11,
          mapId: "michiki-map",
          clickableIcons: true,
          gestureHandling: "greedy",
          disableDefaultUI: false,
        });
        info.current = new google.maps.InfoWindow();

        map.current.addListener("rightclick", async (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const name = prompt("장소 이름을 입력하세요");
          if (!name) return;
          const description = prompt("메모(선택)") || "";
          const travelDate = targetDate || formatDate(new Date());
          try {
            await createPlace(planId, {
              name,
              description,
              latitude: lat,
              longitude: lng,
              travelDate,
              orderInDay: 999,
            });
            toast("장소를 추가했습니다.", "success");
            const { ps } = await refresh();
            drawPlaces(ps);
          } catch {
            toast("장소 추가에 실패했습니다.", "error");
          }
        });

        const { ps } = await refresh();
        drawPlaces(ps);
      } catch (e) {
        toast("구글 맵 로드에 실패했습니다. API 키를 확인하세요.", "error");
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const clearMarkers = (arrRef) => {
    (arrRef.current || []).forEach((m) => m.setMap(null));
    arrRef.current = [];
  };

  const drawPlaces = (list) => {
    if (!map.current) return;
    clearMarkers(placeMarkers);

    if (!Array.isArray(list) || list.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    list.forEach((p) => {
      if (typeof p.latitude !== "number" || typeof p.longitude !== "number") return;
      const pos = { lat: p.latitude, lng: p.longitude };
      const marker = new google.maps.Marker({
        position: pos,
        map: map.current,
        title: p.name || "",
      });
      marker.addListener("click", () => {
        const content = document.createElement("div");
        content.style.minWidth = "220px";
        content.innerHTML = `
          <div style="font-weight:700;margin-bottom:6px;">${p.name || ""}</div>
          ${p.description ? `<div style="color:#555;margin-bottom:6px;">${p.description}</div>` : ""}
          <div style="color:#999;font-size:12px;margin-bottom:8px;">${p.travelDate || ""} · 순서 ${p.orderInDay || 0}</div>
          <div style="display:flex;gap:6px;">
            <button id="m-edit" style="background:#f0d8a8;border:none;padding:6px 8px;border-radius:8px;cursor:pointer;">수정</button>
            <button id="m-del"  style="background:#fffdf5;border:1px solid #f0d8a8;padding:6px 8px;border-radius:8px;cursor:pointer;">삭제</button>
          </div>
        `;
        setTimeout(() => {
          content.querySelector("#m-edit")?.addEventListener("click", async () => {
            const name = prompt("이름 수정", p.name);
            const description = prompt("메모 수정", p.description || "") || "";
            if (!name) return;
            try {
              await updatePlace(planId, p.placeId, { name, description });
              toast("수정했습니다.", "success");
              const { ps } = await refresh();
              drawPlaces(ps);
              info.current?.close();
            } catch {
              toast("수정에 실패했습니다.", "error");
            }
          });
          content.querySelector("#m-del")?.addEventListener("click", async () => {
            if (!confirm("삭제할까요?")) return;
            try {
              await deletePlace(planId, p.placeId);
              toast("삭제했습니다.", "success");
              const { ps } = await refresh();
              drawPlaces(ps);
              info.current?.close();
            } catch {
              toast("삭제에 실패했습니다.", "error");
            }
          });
        }, 0);
        info.current.setContent(content);
        info.current.open({ map: map.current, anchor: marker });
      });
      placeMarkers.current.push(marker);
      bounds.extend(pos);
    });
    if (!bounds.isEmpty()) map.current.fitBounds(bounds);
  };

  const toggleReco = async () => {
    const next = !showReco;
    setShowReco(next);
    if (!next) {
      clearMarkers(recoMarkers);
      return;
    }
    try {
      const recs = await recommendPlaces(planId, {});
      drawRecommendations(Array.isArray(recs) ? recs : []);
      toast(`추천 ${recs?.length ?? 0}건`, "info");
    } catch {
      toast("추천을 불러오지 못했습니다.", "error");
    }
  };

  const drawRecommendations = (recs) => {
    if (!map.current) return;
    clearMarkers(recoMarkers);
    recs.forEach((r) => {
      if (typeof r.latitude !== "number" || typeof r.longitude !== "number") return;
      const marker = new google.maps.Marker({
        position: { lat: r.latitude, lng: r.longitude },
        map: map.current,
        title: r.name || "",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
        },
      });
      marker.addListener("click", async () => {
        const ok = confirm(`"${r.name || "추천 장소"}"을(를) 날짜 ${targetDate || formatDate(new Date())}에 추가할까요?`);
        if (!ok) return;
        try {
          await createPlace(planId, {
            name: r.name || "추천 장소",
            description: r.description || "",
            latitude: r.latitude,
            longitude: r.longitude,
            googlePlaceId: r.googlePlaceId || undefined,
            travelDate: targetDate || formatDate(new Date()),
            orderInDay: 999,
          });
          toast("추가했습니다.", "success");
          const { ps } = await refresh();
          drawPlaces(ps);
        } catch {
          toast("추가에 실패했습니다.", "error");
        }
      });
      recoMarkers.current.push(marker);
    });
  };

  if (loading && !map.current) {
    return <div style={{ padding: 16 }}>지도를 불러오는 중…</div>;
  }

  return (
    <div className="map-page">
      <div className="map-toolbar">
        <div className="map-title">{plan?.name || "여행 지도"}</div>
        <div className="map-controls">
          <label>추가 날짜</label>
          <select value={targetDate || ""} onChange={(e) => setTargetDate(e.target.value)}>
            {dateOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn" onClick={toggleReco}>{showReco ? "추천 숨기기" : "추천 보기"}</button>
        </div>
      </div>
      <div ref={mapRef} className="map-canvas" />
      <div className="map-hint">우클릭으로 핀을 추가할 수 있어요.</div>
    </div>
  );
}
