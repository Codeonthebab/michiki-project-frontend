// src/components/RecommendationsPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { recommendPlaces, createPlace } from "../api/place";
import { toast } from "../lib/toast";
import "./realtime.css";

function formatDate(d) {
  const iso = new Date(d).toISOString();
  return iso.slice(0,10);
}
function uniqDates(places) {
  const set = new Set(places?.map(p => p.travelDate).filter(Boolean));
  if (set.size === 0) set.add(formatDate(new Date()));
  return Array.from(set).sort();
}

export default function RecommendationsPanel({ planId, places, onAdded }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [targetDate, setTargetDate] = useState(null);

  const dateOptions = useMemo(() => uniqDates(places), [places]);
  useEffect(() => { setTargetDate(dateOptions[0] || null); }, [dateOptions]);

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const recs = await recommendPlaces(planId, {});
      setItems(Array.isArray(recs) ? recs : []);
      toast(`추천 ${recs?.length ?? 0}건`, "info");
    } catch (e) {
      toast("추천을 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, []); // auto load once

  const addRec = async (rec) => {
    try {
      const dto = {
        name: rec.name || "추천 장소",
        description: rec.description || "",
        latitude: rec.latitude ?? 0,
        longitude: rec.longitude ?? 0,
        googlePlaceId: rec.googlePlaceId || undefined,
        travelDate: targetDate,
        orderInDay: 999, // append
      };
      await createPlace(planId, dto);
      toast("장소를 추가했습니다.", "success");
      onAdded && onAdded();
    } catch (e) {
      toast("추가에 실패했습니다.", "error");
    }
  };

  return (
    <div className="reco-panel">
      <div className="reco-head">
        <div className="reco-title">추천 장소</div>
        <div className="reco-controls">
          <label>추가 날짜</label>
          <select value={targetDate || ""} onChange={(e) => setTargetDate(e.target.value)}>
            {dateOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn xs" onClick={fetchRecs} disabled={loading}>{loading ? "불러오는 중…" : "새로고침"}</button>
        </div>
      </div>
      <div className="reco-list">
        {items.length === 0 ? (
          <div className="empty">추천 결과가 없습니다.</div>
        ) : items.map((rec, i) => (
          <div key={i} className="reco-item">
            <div className="reco-main">
              <div className="reco-name">{rec.name || "이름 없음"}</div>
              {rec.description && <div className="reco-desc">{rec.description}</div>}
              {(rec.latitude || rec.longitude) && (
                <div className="reco-meta">{rec.latitude}, {rec.longitude}</div>
              )}
            </div>
            <div className="reco-actions">
              <button className="btn xs" onClick={() => addRec(rec)}>추가</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
