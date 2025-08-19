// src/pages/ScheduleMap.jsx
import { useState, useRef, useEffect, useContext, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./ScheduleMap.module.css";

import RoomPresenceDock from "./RoomPresenceDock";
import michikiLogo from "../assets/michiki-logo.webp";
import { getDaysArr } from "../hooks/useDaysArray";
import toLatLngObj from "../utils/toLatLngObj";
import DraggablePin from "./DraggablePin";
import PinModal from "./PinModal";
import CategoryButtons from "./CategoryButtons";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LanguageContext } from "../context/LanguageContext";
import { texts as allTexts } from "../data/translations";
import CustomInfoWindow from "./CustomInfoWindow";

import { createPlace, updatePlace, deletePlace, reorderPlaces, listPlaces } from "../api/place";
import { leavePlan } from "../api/plans";

const API_BASE = import.meta.env.VITE_API_BASE;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ["places"];

const containerStyle = { width: "100%", height: "100vh" };
const center = { lat: 43.0687, lng: 141.3508 };

const lsKey = (roomKey) => `pins:${roomKey}`;

// 서버 place → UI pin
function toUiPin(p, fallbackOrder = 1) {
  return {
    id: p.id,
    name: p.name || "장소",
    address: p.description || "",
    photo: null,
    position: { lat: p.latitude, lng: p.longitude },
    order: p.orderInDay ?? fallbackOrder,
    comment: p.description || "",
    googlePlaceId: p.googlePlaceId || "",
    travelDate: p.travelDate || null,
  };
}

export default function ScheduleMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const { planId: planIdFromParam } = useParams();

  const { destination, title: incomingTitle, startDate: incomingStart, endDate: incomingEnd, planId: planIdFromState } = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  const planIdFromQuery = searchParams.get("planId") || undefined;

  const planId = planIdFromParam || planIdFromState || planIdFromQuery || undefined;
  const roomKey = useMemo(() => planId || destination || location.pathname || "schedule-room", [planId, destination, location.pathname]);

  const { language } = useContext(LanguageContext);
  const texts = allTexts[language];

  const categories = [
    { label: texts.food, type: "restaurant", icon: "🍽️" },
    { label: texts.hotel, type: "lodging", icon: "🛏️" },
    { label: texts.enjoy, type: "tourist_attraction", icon: "📸" },
    { label: texts.museum, type: "museum", icon: "🏛️" },
    { label: texts.transport, type: "transit_station", icon: "🚉" },
    { label: texts.pharmacy, type: "pharmacy", icon: "💊" },
    { label: "ATM", type: "atm", icon: "🏧" },
  ];

  // state
  const [title, setTitle] = useState("여행");
  const [dateRange, setDateRange] = useState([null, null]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pinsByDay, setPinsByDay] = useState([[]]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [showDayDropdown, setShowDayDropdown] = useState(false);

  const [infoWindow, setInfoWindow] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [geocoder, setGeocoder] = useState(null);

  const mapRef = useRef(null);
  const rightClickListenerRef = useRef(null);
  const clickListenerRef = useRef(null);

  const [nearbyMarkers, setNearbyMarkers] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showPath, setShowPath] = useState(true);

  const [isLeaving, setIsLeaving] = useState(false);
  const [isLoadingPins, setIsLoadingPins] = useState(false);

  // 목적지 이동
  useEffect(() => {
    if (!destination || !geocoder || !mapRef.current) return;
    geocoder.geocode({ address: destination }, (results, status) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        mapRef.current.panTo({ lat: loc.lat(), lng: loc.lng() });
        mapRef.current.setZoom(14);
      }
    });
  }, [destination, geocoder]);

  // 초기값 반영
  useEffect(() => {
    if (incomingTitle) setTitle(incomingTitle);
    if (incomingStart && incomingEnd) {
      const sd = typeof incomingStart === "string" ? new Date(incomingStart) : incomingStart;
      const ed = typeof incomingEnd === "string" ? new Date(incomingEnd) : incomingEnd;
      setDateRange([sd, ed]);
    }
    if (destination) setSearchInput(destination);
  }, [incomingTitle, incomingStart, incomingEnd, destination]);

  // 플랜 기본 정보 로드
  useEffect(() => {
    const needsFetch = planId && !(incomingTitle && incomingStart && incomingEnd);
    if (!needsFetch) return;
    const token = localStorage.getItem("accessToken");
    if (!token || !API_BASE) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/plans/${planId}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`GET /plans/${planId} ${res.status}`);
        const data = await res.json();
        setTitle(data.title ?? "여행");
        setDateRange([new Date(data.startDate), new Date(data.endDate)]);
      } catch (err) {
        console.error("플랜 로드 실패:", err);
      }
    })();
  }, [planId, incomingTitle, incomingStart, incomingEnd]);

  // Google Maps Loader
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: GOOGLE_MAPS_LIBRARIES });

  const selectedDayIdxRef = useRef(selectedDayIdx);
  useEffect(() => { selectedDayIdxRef.current = selectedDayIdx; }, [selectedDayIdx]);

  const [startDate, endDate] = dateRange;
  const daysArr = getDaysArr(startDate, endDate);
  const pins = pinsByDay[selectedDayIdx] || [];

  // 날짜 길이 보정
  useEffect(() => {
    if (!startDate || !endDate) {
      setPinsByDay([[]]); setSelectedDayIdx(0); return;
    }
    setPinsByDay((prev) =>
      prev.length === daysArr.length ? prev : Array.from({ length: daysArr.length }, (_, i) => prev[i] || [])
    );
    setSelectedDayIdx((idx) => (idx < daysArr.length ? idx : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // ✅ 서버에서 핀 목록 다시 그루핑하는 헬퍼
  const applyServerPins = (serverPins, days) => {
    const groups = days.map(() => []);
    const dayIndexByIso = new Map(days.map((d, i) => [d.toISOString().slice(0,10), i]));
    serverPins
      .sort((a, b) => (a.travelDate || "").localeCompare(b.travelDate || "") || (a.orderInDay ?? 0) - (b.orderInDay ?? 0))
      .forEach((p) => {
        const iso = (p.travelDate || "").slice(0, 10);
        const idx = dayIndexByIso.get(iso);
        if (idx == null) return;
        groups[idx].push(toUiPin(p, (groups[idx].length || 0) + 1));
      });
    setPinsByDay(groups);
  };

  // 핀 로드
  useEffect(() => {
    const loadPins = async () => {
      if (!startDate || !endDate) return;

      const blank = Array.from({ length: daysArr.length }, () => []);
      setIsLoadingPins(true);
      try {
        if (planId) {
          const serverPins = await listPlaces(planId);
          applyServerPins(serverPins, daysArr);
        } else {
          const raw = localStorage.getItem(lsKey(roomKey));
          if (!raw) setPinsByDay(blank);
          else {
            const parsed = JSON.parse(raw);
            const adjusted = Array.from({ length: daysArr.length }, (_, i) => parsed[i] || []);
            setPinsByDay(adjusted);
          }
        }
      } catch (e) {
        console.error("핀 로드 실패:", e);
        setPinsByDay(blank);
      } finally {
        setIsLoadingPins(false);
      }
    };
    loadPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, roomKey, startDate, endDate]);

// (발췌) 서버에서 핀 로드 후 photo 보강 단계
useEffect(() => {
  if (!isLoaded || !mapRef.current) return;
  // googlePlaceId가 있는 핀들만 사진 1장 채움
  const service = new window.google.maps.places.PlacesService(mapRef.current);
  setPinsByDay(prev =>
    prev.map(dayPins =>
      dayPins.map(pin => {
        if (pin.photo || !pin.googlePlaceId) return pin;
        service.getDetails(
          { placeId: pin.googlePlaceId, fields: ["photos"] },
          (res, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              const url = res.photos?.[0]?.getUrl() ?? null;
              if (url) {
                setPinsByDay(cur =>
                  cur.map(arr =>
                    arr.map(p => (p.id === pin.id ? { ...p, photo: url } : p))
                  )
                );
              }
            }
          }
        );
        return pin;
      })
    )
  );
}, [isLoaded, mapRef.current]); // 의존성 주의

  // planId 없을 때 자동 로컬 저장
  useEffect(() => {
    if (!startDate || !endDate) return;
    if (planId) return;
    localStorage.setItem(lsKey(roomKey), JSON.stringify(pinsByDay));
  }, [pinsByDay, planId, roomKey, startDate, endDate]);

  // Polyline
  const polylineRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current) return;
    if (showPath && pins.length > 1) {
      if (polylineRef.current) polylineRef.current.setMap(null);
      polylineRef.current = new window.google.maps.Polyline({
        path: pins.map((p) => toLatLngObj(p.position)),
        strokeColor: "red",
        strokeWeight: 3,
        strokeOpacity: 1,
        clickable: false,
        map: mapRef.current,
      });
    } else if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, [showPath, pins]);

  // 지도 onLoad
  const onLoadMap = (map) => {
    mapRef.current = map;
    setGeocoder(new window.google.maps.Geocoder());

    if (rightClickListenerRef.current) {
      window.google.maps.event.removeListener(rightClickListenerRef.current);
      rightClickListenerRef.current = null;
    }
    if (clickListenerRef.current) {
      window.google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    // 지도 클릭 → 정보창
    clickListenerRef.current = map.addListener("click", (e) => {
      if (!e.placeId) return;
      e.stop();
      const service = new window.google.maps.places.PlacesService(map);
      service.getDetails(
        { placeId: e.placeId, fields: ["name", "geometry", "formatted_address", "photos", "rating", "user_ratings_total", "types", "formatted_phone_number", "place_id"] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setInfoWindow({
              position: toLatLngObj(place.geometry.location),
              info: {
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                photo: place.photos?.[0]?.getUrl() ?? null,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                phone: place.formatted_phone_number,
              },
            });
          }
        }
      );
    });

    // 우클릭 → 자유 핀 추가 (서버 저장 후 재조회)
    rightClickListenerRef.current = map.addListener("rightclick", async (e) => {
      const latLng = e.latLng;
      if (!latLng) return;

      const [sd, ed] = dateRange;
      if (!sd || !ed) { alert("먼저 여행 날짜를 선택하세요."); return; }

      const days = getDaysArr(sd, ed);
      const travelDate = days[selectedDayIdxRef.current].toISOString().slice(0, 10);

      const payload = {
        name: "직접 지정한 위치",
        description: `위도: ${latLng.lat().toFixed(5)}, 경도: ${latLng.lng().toFixed(5)}`,
        latitude: latLng.lat(),
        longitude: latLng.lng(),
        googlePlaceId: "",
        travelDate,
        orderInDay: (pinsByDay[selectedDayIdxRef.current]?.length || 0) + 1,
      };

      if (planId) {
        try {
          await createPlace(planId, payload);
          const serverPins = await listPlaces(planId);
          applyServerPins(serverPins, days);
        } catch (err) {
          console.error("자유핀 저장 실패:", err);
          alert("자유 핀 저장 실패: " + (err?.message ?? "unknown"));
        }
      } else {
        // 로컬 모드
        const localPin = {
          id: `local-${Date.now()}`,
          name: payload.name,
          address: payload.description,
          photo: null,
          position: { lat: payload.latitude, lng: payload.longitude },
          order: payload.orderInDay,
          comment: payload.description,
          googlePlaceId: "",
          travelDate,
        };
        setPinsByDay((prev) =>
          prev.map((arr, idx) => (idx === selectedDayIdxRef.current ? [...arr, localPin] : arr))
        );
      }
    });
  };

  // 주변 탐색
  const handleNearbySearch = (type) => {
    if (activeCategory === type) {
      setActiveCategory(null); setNearbyMarkers([]); setShowCategoryList(false); return;
    }
    setActiveCategory(type);
    setNearbyMarkers([]); setShowCategoryList(true);
    if (!mapRef.current) return;

    const map = mapRef.current;
    const service = new window.google.maps.places.PlacesService(map);
    const c = map.getCenter();
    service.nearbySearch({ location: c, radius: 1200, type }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length) {
        setNearbyMarkers(results.slice(0, 20));
      } else {
        setNearbyMarkers([]);
        alert("주변에 결과가 없습니다.");
      }
    });
  };

  // 상세 보기
  const showPlaceDetail = (place) => {
    const map = mapRef.current;
    if (!map) return;
    const service = new window.google.maps.places.PlacesService(map);
    service.getDetails(
      { placeId: place.place_id, fields: ["name", "geometry", "formatted_address", "photos", "rating", "user_ratings_total", "types", "formatted_phone_number", "place_id"] },
      (result, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setInfoWindow({
            position: { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() },
            info: {
              placeId: result.place_id,
              name: result.name,
              address: result.formatted_address,
              photo: result.photos?.[0]?.getUrl() ?? null,
              rating: result.rating,
              user_ratings_total: result.user_ratings_total,
              phone: result.formatted_phone_number,
            },
          });
        }
      }
    );
  };

  // 핀 추가 (정보창/검색창에서) → 생성 후 재조회
  const handleAddPin = async () => {
    if (!infoWindow && !searchResult) return;
    if (!startDate || !endDate) { alert("먼저 여행 날짜를 선택하세요."); return; }
    const data = infoWindow || searchResult;
    const position = toLatLngObj(data.position);
    const days = getDaysArr(startDate, endDate);
    const travelDate = days[selectedDayIdx].toISOString().slice(0, 10);

    const payload = {
      name: data.info.name || "장소",
      description: data.info.address || "",
      latitude: position.lat,
      longitude: position.lng,
      googlePlaceId: data.info.placeId || "",
      travelDate,
      orderInDay: (pinsByDay[selectedDayIdx]?.length || 0) + 1,
    };

    try {
      if (planId) {
        await createPlace(planId, payload);
        const serverPins = await listPlaces(planId);
        applyServerPins(serverPins, days);
      } else {
        const localPin = {
          id: `local-${Date.now()}`,
          name: payload.name,
          address: payload.description,
          photo: data.info.photo ?? null,
          position,
          order: payload.orderInDay,
          comment: payload.description,
          googlePlaceId: payload.googlePlaceId,
          travelDate,
        };
        setPinsByDay((prev) =>
          prev.map((arr, idx) => (idx === selectedDayIdx ? [...arr, localPin] : arr))
        );
      }
    } catch (err) {
      console.error(err);
      alert("장소 등록 실패: " + (err?.message ?? "unknown"));
    } finally {
      setInfoWindow(null);
      setSearchResult(null);
      setSearchInput("");
    }
  };

  // 삭제
  const handleDeletePin = async (id) => {
    if (planId) {
      try { await deletePlace(planId, id); }
      catch (e) { console.error("서버 삭제 실패:", e); alert("삭제 실패: " + (e?.message ?? "unknown")); }
      // 서버 기준으로 재조회 → 정합성 보장
      const serverPins = await listPlaces(planId);
      applyServerPins(serverPins, getDaysArr(startDate, endDate));
      return;
    }
    // 로컬 모드
    setPinsByDay((prev) =>
      prev.map((arr, idx) =>
        idx === selectedDayIdx ? arr.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i + 1 })) : arr
      )
    );
  };

  // 모달
  const handlePinClick = (pin) => { setSelectedPin(pin); setModalOpen(true); };
  const handleModalClose = () => { setModalOpen(false); setSelectedPin(null); };

  // Autocomplete
  const onLoadAutocomplete = (ac) => setAutocomplete(ac);

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = pins.findIndex((p) => String(p.id) === String(active.id));
    const newIndex = pins.findIndex((p) => String(p.id) === String(over.id));
    const newOrder = arrayMove(pins, oldIndex, newIndex).map((p, i) => ({ ...p, order: i + 1 }));
    setPinsByDay((prev) => prev.map((arr, idx) => (idx === selectedDayIdx ? newOrder : arr)));

    // 서버 순서 재정렬
    try {
      if (planId) {
        // (발췌) 드래그 정렬 후 서버 반영
const dayDate = getDaysArr(startDate, endDate)[selectedDayIdx].toISOString().slice(0, 10);
await reorderPlaces(planId, {
  travelDate: dayDate,
  places: newOrder.map(p => ({ placeId: p.id, orderInDay: p.order })),
});
        const places = newOrder.map((p) => ({ placeId: Number(p.id), orderInDay: p.order }));
        await reorderPlaces(planId, {
  travelDate: dayDate,
  places: newOrder.map(p => ({ placeId: p.id, orderInDay: p.order })),
});


        // 서버 기준으로 재조회 (보수적 동기화)
        const refreshed = await listPlaces(planId);
        applyServerPins(refreshed, getDaysArr(startDate, endDate));
      }
    } catch (e) {
      console.error("reorder 실패:", e);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className={styles.page}>
      {/* ===== 왼쪽 패널 ===== */}
      <div className={styles.leftPanel}>
        <div className={styles.topActions}>
          <button type="button" onClick={() => navigate("/")} className={styles.logoBtn} aria-label="메인으로">
            <img src={michikiLogo} alt="Michiki" style={{ width: 36, height: 36 }} />
          </button>

          <button
            type="button"
            onClick={async () => {
              try { await navigator.clipboard.writeText(window.location.href); alert("일정이 클립보드에 복사되었습니다!"); }
              catch { alert("복사 실패! (브라우저 권한 또는 HTTPS 환경 확인)"); }
            }}
            className={styles.chipBtn}
          >
            {texts.share}
          </button>

          <button
            type="button"
            onClick={() => setShowPath((v) => !v)}
            className={`${styles.chipBtn} ${showPath ? styles.toggleOn : styles.toggle}`}
            title="동선 선(Polyline) 보이기/숨기기"
          >
            {showPath ? texts.pathOn : texts.pathOff}
          </button>

          <button
            type="button"
            disabled={!planId || isLeaving}
            className={`${styles.chipBtn} ${styles.leaveBtn}`}
            onClick={async () => {
              if (!planId) { alert("플랜 ID가 없어 방을 나갈 수 없어요."); return; }
              const ok = confirm("이 방을 나가시겠어요? (마지막 1인이라면 방이 삭제됩니다)");
              if (!ok) return;
              try {
                setIsLeaving(true);
                await leavePlan(planId);
                alert("방 나가기 완료");
                navigate("/dashboard", { replace: true });
              } catch (err) {
                console.error("leave failed", err);
                const s = err?.response?.status;
                const msg = err?.response?.data?.message || err?.message || "알 수 없는 오류";
                alert(`방 나가기 실패 (${s ?? "네트워크"}): ${msg}`);
              } finally { setIsLeaving(false); }
            }}
            title={!planId ? "플랜 ID가 없어 사용할 수 없습니다" : "방을 나갑니다"}
          >
            {isLeaving ? "나가는 중..." : "방 나가기"}
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.titleInput}
          maxLength={30}
          placeholder={texts.tripNamePlaceholder}
        />

        <div style={{ position: "relative", marginBottom: 1 }}>
          <button type="button" onClick={() => setShowDatePicker((v) => !v)} className={styles.dateBtn}>
            {startDate && endDate
              ? `${startDate.toLocaleDateString("ko-KR").replace(/\./g, ".").replace(/\s/g, "")} ~ ${endDate
                  .toLocaleDateString("ko-KR")
                  .replace(/\./g, ".")
                  .replace(/\s/g, "")}`
              : texts.tripDateSelect}
          </button>
          {showDatePicker && (
            <div className={styles.datePickerWrap}>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setDateRange(update);
                  if (update[0] && update[1]) setShowDatePicker(false);
                }}
                dateFormat="yyyy.MM.dd"
                minDate={new Date()}
                inline
              />
            </div>
          )}
        </div>

        {daysArr.length > 0 && (
          <div className={styles.dayDropdownWrap}>
            <button onClick={() => setShowDayDropdown((v) => !v)} className={styles.dayBtn}>
              {(() => {
                const d = daysArr[selectedDayIdx];
                const weekday = texts.weekdays[d.getDay()];
                const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
                return `${mmdd} (${weekday}) ▼`;
              })()}
            </button>
            {showDayDropdown && (
              <div className={styles.dayList}>
                {daysArr.map((d, idx) => {
                  const weekday = texts.weekdays[d.getDay()];
                  const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
                  const active = idx === selectedDayIdx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDayIdx(idx);
                        setShowDayDropdown(false);
                      }}
                      className={`${styles.dayItem} ${active ? styles.dayItemActive : ""}`}
                    >
                      {mmdd} ({weekday}) {active && "✔"}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchResult) return handleAddPin();
            if (searchInput.trim() && geocoder && mapRef.current) {
              geocoder.geocode({ address: searchInput.trim() }, (results, status) => {
                if (status === "OK" && results[0]) {
                  const loc = results[0].geometry.location;
                  mapRef.current.panTo({ lat: loc.lat(), lng: loc.lng() });
                  mapRef.current.setZoom(14);
                } else {
                  alert(texts.notFound);
                }
              });
            }
          }}
          className={styles.searchForm}
        >
          <Autocomplete
            onLoad={onLoadAutocomplete}
            onPlaceChanged={() => {
              if (!autocomplete) return;
              const place = autocomplete.getPlace();
              if (!place.geometry?.location) return;
              const location = toLatLngObj(place.geometry.location);
              const map = mapRef.current;

              setSearchResult({
                position: location,
                info: {
                  placeId: place.place_id,
                  name: place.name,
                  address: place.formatted_address,
                  photo: place.photos?.[0]?.getUrl() ?? null,
                },
              });

              map.panTo(location);
              map.setZoom(15);
              setNearbyMarkers([]);
            }}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={texts.searchPlace}
              className={styles.searchInput}
            />
          </Autocomplete>
        </form>

        {showCategoryList && nearbyMarkers.length > 0 && (
          <div className={styles.nearbyList}>
            <div className={styles.nearbyTitle}>{texts.searchResultTitle}</div>
            {nearbyMarkers.map((place) => (
              <div key={place.place_id} className={styles.nearbyItem} onClick={() => showPlaceDetail(place)}>
                <img
                  src={place.photos && place.photos[0] ? place.photos[0].getUrl() : "https://via.placeholder.com/60?text=No+Image"}
                  className={styles.nearbyThumb}
                  alt=""
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.nearbyName}>{place.name}</div>
                  {place.rating && (
                    <div className={styles.nearbyMeta}>
                      ⭐ {place.rating}
                      <span style={{ color: "#666", fontSize: 13, marginLeft: 6 }}>
                        ({place.user_ratings_total}
                        {texts.cnt})
                      </span>
                    </div>
                  )}
                  <div className={styles.nearbySub}>{place.vicinity}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.pinListHead}>
          {isLoadingPins && <span className={styles.pinLoading}>불러오는 중…</span>}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pins.map((p) => String(p.id))} strategy={verticalListSortingStrategy}>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 50 }}>
              {pins.map((pin, idx) => (
                <DraggablePin key={pin.id} pin={pin} index={idx} onClick={() => handlePinClick(pin)} onDelete={() => handleDeletePin(pin.id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* ===== 지도 ===== */}
      <div className={styles.mapArea}>
        <CategoryButtons categories={categories} activeCategory={activeCategory} onClick={handleNearbySearch} />

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
          onLoad={onLoadMap}
          options={{ gestureHandling: "greedy", clickableIcons: true, mapTypeControl: false, fullscreenControl: false, streetViewControl: false, zoomControl: true }}
        >
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={toLatLngObj(pin.position)}
              label={{ text: `${pin.order}`, color: "#fff", fontWeight: "bold", fontSize: "16px" }}
              onClick={() => handlePinClick(pin)}
              onRightClick={() => handleDeletePin(pin.id)}
              icon={{ url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", labelOrigin: { x: 15, y: 10 } }}
            />
          ))}

          {nearbyMarkers.map((place) => (
            <Marker
              key={place.place_id}
              position={{ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }}
              icon={{ url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
              title={place.name}
              onClick={() => showPlaceDetail(place)}
            />
          ))}

          {(infoWindow || searchResult) && (
            <CustomInfoWindow
              position={toLatLngObj((infoWindow || searchResult).position)}
              info={(infoWindow || searchResult).info}
              onClose={() => {
                setInfoWindow(null);
                setSearchResult(null);
              }}
              onAddPin={handleAddPin}
              texts={texts}
            />
          )}
        </GoogleMap>

        <PinModal
          pin={selectedPin}
          open={modalOpen}
          onClose={handleModalClose}
          onCommentChange={async (comment) => {
            // 화면 즉시 반영
            setPinsByDay((arr) =>
              arr.map((pins, idx) =>
                idx !== selectedDayIdx
                  ? pins
                  : pins.map((p) => (p.id === selectedPin.id ? { ...p, comment, address: comment, name: p.name } : p))
              )
            );
            setSelectedPin((p) => ({ ...p, comment, address: comment }));

            // 서버 반영 (name/description만)
            try {
              if (planId) {
                // (발췌) onCommentChange 수정
await updatePlace(planId, selectedPin.id, {
  name: selectedPin.name || "장소",
  description: comment,   // ← 스펙은 name/description만
});
              }
            } catch (err) {
              console.error("메모 수정 실패:", err);
              alert("메모 수정 실패: " + (err?.message ?? "unknown"));
            }
          }}
        />
      </div>

      <RoomPresenceDock roomKey={roomKey} currentUser={user} />
    </div>
  );
}
