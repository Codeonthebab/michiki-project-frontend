import React, { useState } from "react";
import scheduleIcon from "./tool/Schedule.PNG";
import searchIcon from "./tool/search.PNG";
// 한국 여행지 이미지 import (경로 맞게 고쳐주세요!)
import 강릉 from "./korea/강릉.jpg";
import 경주 from "./korea/경주.jpg";
import 광주 from "./korea/광주.jpg";
import 담양 from "./korea/담양.jpg";
import 대구 from "./korea/대구.jpg";
import 대전 from "./korea/대전.jpg";
import 보성 from "./korea/보성.jpg";
import 부산 from "./korea/부산.jpg";
import 서울 from "./korea/서울.jpg";
import 수원 from "./korea/수원.jpg";
import 순천 from "./korea/순천.jpg";
import 여수 from "./korea/여수.jpg";
import 울릉도 from "./korea/울릉도.jpg";
import 전주 from "./korea/전주.jpg";
import 제주도 from "./korea/제주도.jpg";
import 춘천 from "./korea/춘천.jpg";
// 일본 여행지 이미지 import (경로 맞게 고쳐주세요!)
import 교토 from "./japan/교토.jpg";
import 기타큐슈 from "./japan/기타큐슈.jpg";
import 나고야 from "./japan/나고야.jpg";
import 나라 from "./japan/나라.jpg";
import 닛코 from "./japan/닛코.jpg";
import 도쿄 from "./japan/도쿄.jpg";
import 삿포로 from "./japan/삿포로.jpg";
import 시즈오카 from "./japan/시즈오카.jpg";
import 야마가타 from "./japan/야마가타.jpg";
import 오사카 from "./japan/오사카.jpg";
import 오키나와 from "./japan/오키나와.jpg";
import 요코하마 from "./japan/요코하마.jpg";
import 후쿠오카 from "./japan/후쿠오카.jpg";
import 히로시마 from "./japan/히로시마.jpg";

// 모달 애니메이션 스타일
const modalStyle = {
  transition: "transform 0.38s cubic-bezier(0.48,0.04,0.22,0.99), opacity 0.24s",
  transform: "translateY(40%)",
  opacity: 0,
};
const modalStyleOpen = {
  transform: "translateY(0)",
  opacity: 1,
};

// 영어 도시명
const koreaCityEn = {
  "강릉": "Gangneung", "경주": "Gyeongju", "광주": "Gwangju", "담양": "Damyang",
  "대구": "Daegu", "대전": "Daejeon", "보성": "Boseong", "부산": "Busan", "서울": "Seoul",
  "수원": "Suwon", "순천": "Suncheon", "여수": "Yeosu", "울릉도": "Ulleungdo",
  "전주": "Jeonju", "제주도": "Jeju", "춘천": "Chuncheon",
};
const japanCityEn = {
  "교토": "Kyoto", "기타큐슈": "Kitakyushu", "나고야": "Nagoya", "나라": "Nara",
  "닛코": "Nikko", "도쿄": "Tokyo", "삿포로": "Sapporo", "시즈오카": "Shizuoka",
  "야마가타": "Yamagata", "오사카": "Osaka", "오키나와": "Okinawa",
  "요코하마": "Yokohama", "후쿠오카": "Fukuoka", "히로시마": "Hiroshima",
};

// 여행지 데이터
const koreaCities = [
  { id: 1, nameKo: "강릉", img: 강릉 }, { id: 2, nameKo: "경주", img: 경주 },
  { id: 3, nameKo: "광주", img: 광주 }, { id: 4, nameKo: "담양", img: 담양 },
  { id: 5, nameKo: "대구", img: 대구 }, { id: 6, nameKo: "대전", img: 대전 },
  { id: 7, nameKo: "보성", img: 보성 }, { id: 8, nameKo: "부산", img: 부산 },
  { id: 9, nameKo: "서울", img: 서울 }, { id: 10, nameKo: "수원", img: 수원 },
  { id: 11, nameKo: "순천", img: 순천 }, { id: 12, nameKo: "여수", img: 여수 },
  { id: 13, nameKo: "울릉도", img: 울릉도 }, { id: 14, nameKo: "전주", img: 전주 },
  { id: 15, nameKo: "제주도", img: 제주도 }, { id: 16, nameKo: "춘천", img: 춘천 },
];
const japanCities = [
  { id: 1, nameKo: "교토", img: 교토 }, { id: 2, nameKo: "기타큐슈", img: 기타큐슈 },
  { id: 3, nameKo: "나고야", img: 나고야 }, { id: 4, nameKo: "나라", img: 나라 },
  { id: 5, nameKo: "닛코", img: 닛코 }, { id: 6, nameKo: "도쿄", img: 도쿄 },
  { id: 7, nameKo: "삿포로", img: 삿포로 }, { id: 8, nameKo: "시즈오카", img: 시즈오카 },
  { id: 9, nameKo: "야마가타", img: 야마가타 }, { id: 10, nameKo: "오사카", img: 오사카 },
  { id: 11, nameKo: "오키나와", img: 오키나와 }, { id: 12, nameKo: "요코하마", img: 요코하마 },
  { id: 13, nameKo: "후쿠오카", img: 후쿠오카 }, { id: 14, nameKo: "히로시마", img: 히로시마 },
];

// 왼쪽 여행 목록 더미 데이터
const travelList = [
  { id: 1, title: "내 여행 1", start: "2025/06/08", end: "2025/06/13" },
  { id: 2, title: "내 여행 2", start: "2025/06/21", end: "2025/06/23" },
  { id: 3, title: "지난 여행 1", start: "2025/03/01", end: "2025/03/21" },
  { id: 4, title: "지난 여행 2", start: "2025/06/03", end: "2025/06/05" },
];

// 달력 모달
// 달력 모달
function CalendarModal({ open, onClose, onSelect }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => setShow(true), 10); // 트랜지션 자연스럽게 보이게 약간 딜레이
    } else {
      setShow(false);
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.23)", display: "flex", justifyContent: "center", alignItems: "center"
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...modalStyle,              // ← 이 부분 추가
          ...(show ? modalStyleOpen : {}), // ← 이 부분 추가
          minWidth: 390, minHeight: 430, background: "#6b4f32",
          borderRadius: 40, boxShadow: "0 10px 30px #0006", display: "flex", flexDirection: "column", alignItems: "center"
        }}
      >
        {/* 기존 안의 내용은 그대로~ */}
        <div style={{
          color: "#fff", fontWeight: "bold", fontSize: 24, marginTop: 32, marginBottom: 8, letterSpacing: 1
        }}>일정 생성</div>
        <div style={{ background: "#fffdf5", borderRadius: 28, padding: 25, minWidth: 340 }}>
          <div style={{ fontWeight: "bold", fontSize: 18, textAlign: "center", marginBottom: 7 }}>
            여행 일정이 어떻게 되시나요?
          </div>
          <div style={{ color: "#7d675a", fontSize: 13, textAlign: "center", marginBottom: 17 }}>
            여행의 시작일과 도착 시간을 입력해주세요<br />
            최대 30일 연속 설정 가능합니다.
          </div>
          <div style={{
            background: "#fff",
            borderRadius: 19,
            margin: "0 auto 18px auto",
            padding: "18px 12px 14px 12px",
            textAlign: "center",
            width: 280,
            fontSize: 15,
            color: "#8c7660"
          }}>
            {/* 여기에 react-calendar 등 실제 달력 UI 삽입 추천 */}
            <span style={{ letterSpacing: 2 }}>2025년 6월 ~ 2025년 7월</span>
            <div style={{ color: "#ff8572", fontWeight: "bold", margin: "8px 0" }}>
              (달력 라이브러리 삽입 영역)
            </div>
          </div>
          <input
            style={{
              width: "95%", borderRadius: 15, padding: "9px 12px", fontSize: 16,
              border: "2px solid #d6c3a9", outline: "none", marginBottom: 15
            }}
            placeholder="여행 타이틀을 입력하세요"
          />
          <button
            onClick={() => { onSelect && onSelect(); }}
            style={{
              background: "#6b4f32", color: "#fff", border: "none", borderRadius: 18,
              padding: "11px 0", width: "95%", fontWeight: "bold", fontSize: 17, marginBottom: 0, cursor: "pointer"
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}


// 여행지 상세정보 모달
function PlaceDetailModal({ open, onClose, place, activeTab }) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
    }
  }, [open]);

  if (!open || !place) return null;
  const cityEn = activeTab === "korea" ? koreaCityEn : japanCityEn;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.23)", display: "flex", justifyContent: "center", alignItems: "center"
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...modalStyle,
          ...(show ? modalStyleOpen : {}),
          display: "flex", background: "#6b4f32", borderRadius: 32,
          minWidth: 650, maxWidth: 850, padding: 30, alignItems: "center", gap: 32, position: "relative"
        }}
      >
        {/* 왼쪽 텍스트 */}
        <div style={{
          flex: 1, background: "#fef7e5", borderRadius: 28, padding: 28, fontSize: 15, minWidth: 290, maxWidth: 340, position: "relative"
        }}>
          <div style={{
            fontWeight: "bold", fontSize: 20, color: "#6b4f32", marginBottom: 2
          }}>
            일정 생성
          </div>
          <div style={{ fontWeight: "bold", fontSize: 24, marginBottom: 6, color: "#80593a" }}>
            {place.nameKo}
          </div>
          <div style={{
            color: "#b7a47f", fontSize: 15, fontStyle: "italic", marginBottom: 14,
          }}>
            {cityEn[place.nameKo]}
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 17 }}>
            {/* 여행지 소개(원하는 내용으로!) */}
            겨울엔 눈꽃 축제, 여름엔 라벤더, 낭만적인 운하까지.<br />
            사계절 내내 다채로운 풍경과 미식의 즐거움이 가득해요.<br />
            {place.nameKo}에서 잊지 못할 추억을 만들어 보세요!
          </p>
          <div style={{ display: "flex", gap: 35, fontWeight: "bold", fontSize: 15, marginBottom: 8 }}>
            <div>💰 화폐<br />{activeTab === "korea" ? "원/KRW" : "엔/円"}</div>
            <div>⚡ 전압<br />{activeTab === "korea" ? "220V" : "110V"}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
              background: "#a67a41", color: "#fff", border: "none",
              borderRadius: 17, padding: "10px 32px", fontWeight: "bold", fontSize: 17, cursor: "pointer",
              marginTop: 40
            }}
          >저장</button>
        </div>
        {/* 오른쪽 사진 */}
        <div style={{
          flex: 1, borderRadius: 25, overflow: "hidden", minWidth: 290, minHeight: 190, maxWidth: 340, maxHeight: 250,
          boxShadow: "0 3px 14px #0003"
        }}>
          <img src={place.img} alt={place.nameKo}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </div>
  );
}


// 메인 컴포넌트
function Main() {
  const [activeTab, setActiveTab] = useState("korea");
  const [search, setSearch] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, place: null });

  const filteredCities =
    activeTab === "korea"
      ? koreaCities.filter((c) => c.nameKo.includes(search))
      : japanCities.filter((c) => c.nameKo.includes(search));

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#fff9f0" }}>
      <div style={{ display: "flex" }}>
        {/* 왼쪽 패널 (고정) */}
        <aside
          style={{
            width: 270,
            background: "#80593a",
            padding: 24,
            minHeight: "100vh",
            height: "100vh",
            color: "#fff",
            boxSizing: "border-box",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ marginBottom: 2 }}>
            <select
              style={{
                width: 80,
                fontSize: 17,
                fontWeight: "bold",
                background: "#fff",
                color: "#7d593e",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                marginBottom: 0,
                cursor: "pointer",
                boxShadow: "0 1px 3px #bfa27c50",
              }}
              defaultValue="2025"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          {/* 여행 리스트 */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              minHeight: 0,
              marginBottom: 12,
            }}
          >
            {travelList.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  color: "#80593a",
                  borderRadius: 16,
                  padding: "14px 20px",
                  marginBottom: 15,
                  boxShadow: "0 2px 8px #2f140017",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  position: "relative",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#a08a76" }}>
                  {item.start} - {item.end}
                </div>
                <button
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 13,
                    background: "none",
                    border: "none",
                    color: "#af9787",
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            ))}
            <div style={{ color: "#cbbfb7", textAlign: "center" }}>...</div>
          </div>
          {/* 일정 추가 버튼(달력 모달) */}
          <button
            onClick={() => setCalendarOpen(true)}
            style={{
              background: "#fff",
              color: "#80593a",
              borderRadius: 18,
              border: "none",
              fontWeight: "bold",
              padding: "10px 0",
              fontSize: 21,
              boxShadow: "0 2px 8px #bfa27c40",
              width: "100%",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <img src={scheduleIcon} alt="일정추가" style={{ width: 26, height: 26 }} />
          </button>
        </aside>
        {/* 오른쪽 메인 */}
        <section
          style={{
            flex: 1,
            marginLeft: 270,
            padding: "36px 44px 0 44px",
            minHeight: "100vh",
            boxSizing: "border-box",
            background: "#fff9f0",
            width: "100%",
          }}
        >
          {/* 오른쪽 상단 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 14,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                background: "#fffdf5",
                borderRadius: 18,
                boxShadow: "0 2px 6px #bfa27c23",
                display: "flex",
                alignItems: "center",
                width: 350,
                padding: "6px 17px",
                fontSize: 15,
                marginRight: 32,
              }}
            >
              <input
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 15,
                  color: "#7d593e",
                  fontWeight: "bold",
                }}
                placeholder="도시 명을 검색해보세요."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <img
                src={searchIcon}
                alt="검색"
                style={{
                  marginLeft: 8,
                  width: 23,
                  height: 23,
                  cursor: "pointer",
                  opacity: 0.75,
                }}
              />
            </div>
            <div
              style={{
                color: "#a08a76",
                fontWeight: "bold",
                fontSize: 16,
                letterSpacing: 1,
                opacity: 0.7,
                cursor: "pointer",
                marginRight: 15,
              }}
            >
              🌐 Language
            </div>
          </div>
          {/* 탭 & 구분선 */}
          <div
            style={{
              display: "flex",
              gap: 44,
              margin: "30px 0 8px 30px",
              alignItems: "flex-end",
            }}
          >
            <div
              onClick={() => setActiveTab("korea")}
              style={{
                fontWeight: "bold",
                fontSize: 21,
                color: activeTab === "korea" ? "#80593a" : "#bca98b",
                borderBottom:
                  activeTab === "korea" ? "5px solid #80593a" : "none",
                cursor: "pointer",
                paddingBottom: 2,
                letterSpacing: "2px",
                marginRight: 8,
              }}
            >
              한국
            </div>
            <div
              onClick={() => setActiveTab("japan")}
              style={{
                fontWeight: "bold",
                fontSize: 21,
                color: activeTab === "japan" ? "#80593a" : "#bca98b",
                borderBottom:
                  activeTab === "japan" ? "5px solid #80593a" : "none",
                cursor: "pointer",
                paddingBottom: 2,
                letterSpacing: "2px",
                marginRight: 8,
              }}
            >
              일본
            </div>
          </div>
          <div
            style={{
              width: "98%",
              height: 6,
              background: "#80593a",
              opacity: 0.23,
              borderRadius: 9,
              marginBottom: 33,
            }}
          ></div>
          {/* 여행지 카드 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 42,
              marginLeft: 24,
              marginRight: 24,
            }}
          >
            {filteredCities.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#fff",
                  borderRadius: 21,
                  boxShadow: "0 2px 16px #bfa27c23",
                  overflow: "hidden",
                  cursor: "pointer",
                  paddingBottom: 8,
                  minHeight: 275,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-7px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
                onClick={() => setDetailModal({ open: true, place: c })}
              >
                <div style={{ width: "100%", height: 150, overflow: "hidden" }}>
                  <img
                    src={c.img}
                    alt={c.nameKo}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderTopLeftRadius: 21,
                      borderTopRightRadius: 21,
                      borderBottom: "2px solid #f6e5d3",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: "100%",
                    marginTop: 11,
                    paddingLeft: 17,
                  }}
                >
                  {/* New 뱃지는 강릉, 경주, 교토, 도쿄만 예시로 표시 */}
                  {(c.nameKo === "강릉" ||
                    c.nameKo === "경주" ||
                    c.nameKo === "교토" ||
                    c.nameKo === "도쿄") && (
                    <span
                      style={{
                        color: "#ffb859",
                        fontWeight: "bold",
                        fontSize: 15,
                        marginRight: 5,
                      }}
                    >
                      New
                    </span>
                  )}
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: 22,
                      color: "#80593a",
                      verticalAlign: "middle",
                    }}
                  >
                    {c.nameKo}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    marginLeft: 17,
                    color: "#b4a089",
                    fontSize: 16,
                    fontFamily: "monospace, sans-serif",
                    letterSpacing: "1.5px",
                    marginTop: 3,
                    opacity: 0.9,
                  }}
                >
                  {activeTab === "korea"
                    ? koreaCityEn[c.nameKo]
                    : japanCityEn[c.nameKo]}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {/* 모달들 */}
      <CalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onSelect={() => setCalendarOpen(false)}
      />
      <PlaceDetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, place: null })}
        place={detailModal.place}
        activeTab={activeTab}
      />
    </div>
  );
}

export default Main;
