// src/pages/PlanDetailPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlan, changePlanColor, leavePlan } from "../api/plans";
import { listPlaces, updatePlace, deletePlace, reorderPlaces } from "../api/place";
import { connectPlanSocket } from "../lib/socket";
import { toast } from "../lib/toast";
import LiveCursors from "../components/LiveCursors";
import ChatPanel from "../components/ChatPanel";
import RecommendationsPanel from "../components/RecommendationsPanel";
import ToastHost from "../components/ToastHost";
import "./realtime.css";

function groupByDate(arr) {
  const map = new Map();
  for (const p of arr) {
    const key = p.travelDate || "날짜없음";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}

export default function PlanDetailPage() {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [showReco, setShowReco] = useState(true);

  const dragInfo = useRef({ placeId: null, date: null });

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getPlan(planId);
      setPlan(data);
      const ps = await listPlaces(planId);
      setPlaces(ps);
    } catch (e) {
      toast("플랜을 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [planId]); // eslint-disable-line

  useEffect(() => {
    const s = connectPlanSocket(planId, {
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });
    setSocket(s);
    return () => s.disconnect();
  }, [planId]);

  const onChangeColor = async (e) => {
    const color = e?.target?.value || "#f0d8a8";
    try {
      await changePlanColor(planId, color);
      toast("색상을 변경했습니다.", "success");
      await refresh();
    } catch (e) {
      toast("색상 변경에 실패했습니다.", "error");
    }
  };

  const onLeave = async () => {
    try {
      await leavePlan(planId);
      navigate("/");
    } catch {
      toast("나가기에 실패했습니다.", "error");
    }
  };

  // --- DnD within a date group ---
  const onDragStart = (p) => (e) => {
    dragInfo.current = { placeId: p.placeId, date: p.travelDate || "날짜없음" };
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (target) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (target) => async (e) => {
    e.preventDefault();
    const from = dragInfo.current;
    dragInfo.current = { placeId: null, date: null };
    if (!from.placeId) return;
    const sameDate = (target.travelDate || "날짜없음") === from.date;
    if (!sameDate) {
      toast("같은 날짜 내에서만 순서 변경이 가능합니다.", "info");
      return;
    }
    // compute new order for that date
    const dateKey = target.travelDate || "날짜없음";
    const group = places.filter((x) => (x.travelDate || "날짜없음") === dateKey);
    const rest = places.filter((x) => (x.travelDate || "날짜없음") !== dateKey);

    const fromIdx = group.findIndex((x) => x.placeId === from.placeId);
    const toIdx = group.findIndex((x) => x.placeId === target.placeId);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const reordered = group.slice();
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // optimistic UI
    setPlaces([...rest, ...reordered].sort((a,b) => (a.travelDate||"") < (b.travelDate||"") ? -1 : (a.travelDate||"") > (b.travelDate||"") ? 1 : (a.orderInDay||0) - (b.orderInDay||0)));

    try {
      const payload = {
        travelDate: target.travelDate,
        places: reordered.map((p, i) => ({ placeId: p.placeId, orderInDay: i + 1 })),
      };
      await reorderPlaces(planId, payload);
      toast("순서를 저장했습니다.", "success");
      await refresh();
    } catch (e) {
      toast("순서 저장에 실패했습니다.", "error");
      await refresh();
    }
  };

  if (loading) return <div style={{ padding: 24 }}>불러오는 중…</div>;
  if (!plan) return <div style={{ padding: 24 }}>플랜을 찾을 수 없습니다.</div>;

  const groups = Array.from(groupByDate(places).entries()).sort((a,b) => (a[0]||"") < (b[0]||"") ? -1 : 1);

  return (
    <div className="detail-wrap">
      <ToastHost />

      <div className="detail-header" style={{ background: plan?.color || "#fffdf5" }}>
        <h1 className="detail-title">
          <span className={`status-dot ${connected ? "on" : "off"}`} />
          {plan?.name || "여행 계획"}
        </h1>
        <div className="detail-actions">
          <input type="color" defaultValue={plan?.color || "#f0d8a8"} onChange={onChangeColor} title="색상 변경" />
          <button className="btn" onClick={() => setShowReco((v) => !v)}>{showReco ? "추천 닫기" : "추천 열기"}</button>
          <button className="btn outline" onClick={onLeave}>나가기</button>
        </div>
      </div>

      <div className="detail-body">
        <div className="left-pane">
          <h2>일정 장소</h2>

          {groups.length === 0 ? (
            <div className="empty">아직 등록된 장소가 없습니다.</div>
          ) : (
            groups.map(([date, list]) => (
              <div key={date} className="date-group">
                <div className="date-title">{date}</div>
                <ul className="place-list">
                  {list
                    .sort((a,b) => (a.orderInDay||0) - (b.orderInDay||0))
                    .map((p) => (
                    <li
                      key={p.placeId}
                      className="place-item dnd"
                      draggable
                      onDragStart={onDragStart(p)}
                      onDragOver={onDragOver(p)}
                      onDrop={onDrop(p)}
                    >
                      <div>
                        <div className="place-name">{p.name}</div>
                        {p.description && <div className="place-desc">{p.description}</div>}
                        <div className="place-meta">순서 {p.orderInDay}</div>
                      </div>
                      <div className="place-actions">
                        <button className="btn xs" onClick={async () => {
                          const name = prompt("이름 수정", p.name);
                          const description = prompt("메모 수정", p.description || "") || "";
                          if (name) {
                            try {
                              await updatePlace(planId, p.placeId, { name, description });
                              toast("수정했습니다.", "success");
                              await refresh();
                            } catch {
                              toast("수정에 실패했습니다.", "error");
                            }
                          }
                        }}>수정</button>
                        <button className="btn xs outline" onClick={async () => {
                          if (confirm("삭제할까요?")) {
                            try {
                              await deletePlace(planId, p.placeId);
                              toast("삭제했습니다.", "success");
                              await refresh();
                            } catch {
                              toast("삭제에 실패했습니다.", "error");
                            }
                          }
                        }}>삭제</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="right-pane">
          {showReco && <RecommendationsPanel planId={planId} places={places} onAdded={refresh} />}
          <ChatPanel planId={planId} socket={socket} user={user} />
        </div>
      </div>

      <LiveCursors planId={planId} socket={socket} user={user} />
    </div>
  );
}
