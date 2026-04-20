import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────
interface Toilet {
  id: number;
  name: string;
  addr: string;
  region: string;
  type: string;
  lat: number;
  lng: number;
  maleStall: number;
  femStall: number;
  stalls: number;
  accessible: boolean;
  babyRoom: boolean;
  diaper: boolean;
  openTime: string;
  hours: string;
  manager?: string;
  phone?: string;
  owner?: string;
  paper: boolean;
  soap: boolean;
  bidet: boolean;
  dryer: boolean;
  crowd: number;
  clean: number;
  rating: number;
  reviews: Review[];
  distance: string;
  floors: string;
  gender: string;
  vendingMachine?: boolean;
  vendingMachineLocation?: string;
  mapX?: number;
  mapY?: number;
}

interface Review {
  user: string;
  score: number;
  text: string;
  date: string;
}

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────
const HWACHELIN = 4.5;

const REGION_ORDER = [
  "전체","서울특별시","경기도","인천광역시","강원도","충청도",
  "대전광역시","세종특별자치시","경상도","부산광역시","울산광역시",
  "전라도","광주광역시","제주특별자치도","기타"
];

const FILTER_KEYS = ["paper","soap","bidet","accessible","babyRoom","hours24"];

const ONBOARDING_DATA = [
  {
    icon:"🗺", color:"#6C63FF", bg:"#EEEDFE",
    title:"가장 빠른 화장실\n바로 찾기",
    desc:"현재 위치 기반으로 가장 가까운\n공중화장실을 실시간으로 찾아드려요."
  },
  {
    icon:"🧻", color:"#1D9E75", bg:"#E1F5EE",
    title:"화장지·비데·혼잡도\n실시간 확인",
    desc:"들어가기 전에 미리 확인하세요.\n사용자가 직접 제보하는 실시간 정보예요."
  },
  {
    icon:"💰", color:"#E9A800", bg:"#FFFBEA",
    title:"걸으면\n포인트 적립",
    desc:"걸음수에 따라 포인트가 쌓여요.\n화장실 앱 안에서 다양하게 사용하세요!"
  }
];

const CHEER_MSGS = [
  "💪 참을 수 있어! 조금만 더!",
  "🔥 거의 다 왔어! 포기하지 마!",
  "🏃 뛰어! 지금 당장 뛰어!!",
  "😤 항문아 버텨줘... 제발...!",
  "🧘 평정심... 평정심을 유지해...",
  "💨 바람처럼 달려가자!",
  "🙏 신이시여 2분만 더 버티게 해주소서",
  "🦸 당신은 할 수 있어요! 영웅이에요!",
  "⚡ 번개보다 빠르게! 지금 GO!",
  "🎯 목표는 오직 하나! 화장실!",
];

const CONV_STORES = [
  {name:"CU 편의점", brand:"CU", dist:"180m", walk:3, emoji:"🟡"},
  {name:"GS25",      brand:"GS25", dist:"240m", walk:4, emoji:"🔵"},
  {name:"세븐일레븐", brand:"7-ELV", dist:"320m", walk:5, emoji:"🔴"},
  {name:"이마트24",  brand:"E24", dist:"410m", walk:6, emoji:"🟢"},
];

const SAMPLE_TOILETS: Toilet[] = [
  {id:1,name:"서울시청 공중화장실",addr:"서울특별시 중구 세종대로 110",region:"서울특별시",type:"city",lat:37.5665,lng:126.978,maleStall:4,femStall:4,stalls:8,accessible:true,babyRoom:true,diaper:true,openTime:"24시간",hours:"24시간",manager:"서울시청",paper:true,soap:true,bidet:true,dryer:true,crowd:2,clean:4.3,rating:4.6,reviews:[{user:"홍길동",score:5,text:"깨끗해요!",date:"2025-04-01"}],distance:"120m",floors:"1층",gender:"남/여"},
  {id:2,name:"부산역 화장실",addr:"부산광역시 동구 중앙대로 206",region:"부산광역시",type:"station",lat:35.115,lng:129.042,maleStall:5,femStall:5,stalls:10,accessible:true,babyRoom:false,diaper:false,openTime:"05:00~24:00",hours:"05:00~24:00",manager:"한국철도공사",paper:true,soap:true,bidet:false,dryer:false,crowd:4,clean:3.5,rating:3.8,reviews:[],distance:"300m",floors:"지하 1층",gender:"남/여"},
  {id:3,name:"경복궁 공중화장실",addr:"서울특별시 종로구 사직로 161",region:"서울특별시",type:"park",lat:37.5796,lng:126.977,maleStall:3,femStall:3,stalls:6,accessible:true,babyRoom:true,diaper:true,openTime:"09:00~18:00",hours:"09:00~18:00",manager:"문화재청",paper:true,soap:true,bidet:false,dryer:true,crowd:3,clean:4.0,rating:4.2,reviews:[],distance:"500m",floors:"지상 1층",gender:"남/여"},
  {id:4,name:"제주국제공항 화장실",addr:"제주특별자치도 제주시 공항로 2",region:"제주특별자치도",type:"station",lat:33.507,lng:126.4929,maleStall:6,femStall:6,stalls:12,accessible:true,babyRoom:true,diaper:true,openTime:"24시간",hours:"24시간",manager:"한국공항공사",paper:true,soap:true,bidet:true,dryer:true,crowd:3,clean:4.6,rating:4.7,reviews:[{user:"김철수",score:5,text:"공항 화장실 최고!",date:"2025-04-10"}],distance:"200m",floors:"1층",gender:"남/여"},
  {id:5,name:"인천대공원 화장실",addr:"인천광역시 남동구 장수동 산79",region:"인천광역시",type:"park",lat:37.42,lng:126.731,maleStall:2,femStall:2,stalls:4,accessible:false,babyRoom:false,diaper:false,openTime:"07:00~22:00",hours:"07:00~22:00",manager:"인천광역시",paper:false,soap:true,bidet:false,dryer:false,crowd:1,clean:3.0,rating:3.2,reviews:[],distance:"800m",floors:"지상 1층",gender:"공용"},
];

// ─────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────
function getRegion(addr: string): string {
  if (!addr) return "기타";
  if (addr.startsWith("서울")) return "서울특별시";
  if (addr.startsWith("인천")) return "인천광역시";
  if (addr.startsWith("경기")) return "경기도";
  if (addr.startsWith("강원")) return "강원도";
  if (addr.startsWith("대전")) return "대전광역시";
  if (addr.startsWith("세종")) return "세종특별자치시";
  if (/충청|충남|충북/.test(addr)) return "충청도";
  if (/대구|경상|경남|경북/.test(addr)) return "경상도";
  if (addr.startsWith("부산")) return "부산광역시";
  if (addr.startsWith("울산")) return "울산광역시";
  if (addr.startsWith("광주")) return "광주광역시";
  if (/전라|전남|전북/.test(addr)) return "전라도";
  if (addr.startsWith("제주")) return "제주특별자치도";
  return "기타";
}

function getPlaceType(name: string): string {
  if (!name) return "default";
  if (/시청|구청|군청|주민센터|동사무소/.test(name)) return "city";
  if (/역|터미널|공항/.test(name)) return "station";
  if (/공원|광장|숲|해변|유원지/.test(name)) return "park";
  if (/마트|백화점|쇼핑|몰/.test(name)) return "mall";
  if (/보건소|병원|의원/.test(name)) return "health";
  if (/시장|전통시장/.test(name)) return "market";
  if (/주유소|휴게소/.test(name)) return "gas";
  if (/주차장/.test(name)) return "parking";
  if (/학교|대학|초등|중학|고등/.test(name)) return "school";
  if (/도서관|박물관|미술관|문화/.test(name)) return "culture";
  if (/경찰|소방/.test(name)) return "police";
  if (/빌딩|타워|오피스/.test(name)) return "building";
  return "default";
}

const PLACE_ICONS: Record<string,{emoji:string,bg:string,color:string,label:string}> = {
  city:     {emoji:"🏛",  bg:"#E6F1FB", color:"#185FA5", label:"관공서"},
  station:  {emoji:"🚉",  bg:"#EAF3DE", color:"#3B6D11", label:"교통시설"},
  park:     {emoji:"🌳",  bg:"#E1F5EE", color:"#0F6E56", label:"공원/자연"},
  mall:     {emoji:"🛒",  bg:"#FAEEDA", color:"#854F0B", label:"마트/쇼핑"},
  health:   {emoji:"🏥",  bg:"#FCEBEB", color:"#A32D2D", label:"병원/보건소"},
  market:   {emoji:"🏪",  bg:"#FFF8E1", color:"#856404", label:"시장"},
  gas:      {emoji:"⛽",  bg:"#F1EFE8", color:"#5F5E5A", label:"주유소/휴게소"},
  parking:  {emoji:"🅿",  bg:"#E3F2FD", color:"#0D47A1", label:"주차장"},
  school:   {emoji:"🏫",  bg:"#E8F4FD", color:"#1A6496", label:"학교"},
  culture:  {emoji:"🎭",  bg:"#F3E5F5", color:"#6A1B9A", label:"문화시설"},
  police:   {emoji:"🚔",  bg:"#E8EAF6", color:"#283593", label:"경찰/소방"},
  building: {emoji:"🏢",  bg:"#ECEFF1", color:"#37474F", label:"빌딩/건물"},
  default:  {emoji:"🚻",  bg:"#EEEDFE", color:"#534AB7", label:"공공화장실"},
};

const URGENCY_COLORS = ["","#1D9E75","#3B6D11","#E9A800","#D85A30","#A32D2D"];
const CROWD_LABELS   = ["","한산","보통","혼잡","매우혼잡","극혼잡"];
const PAGE_SIZE = 30;

async function decodeKorean(buffer: ArrayBuffer): Promise<string> {
  try { return new TextDecoder("euc-kr").decode(buffer); }
  catch { return new TextDecoder("utf-8").decode(buffer); }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text: string): Toilet[] {
  const lines = text.split(/\r?\n/);
  const result: Toilet[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const c = parseCSVLine(line);
    if (c.length < 22) continue;
    const lat = parseFloat(c[21]), lng = parseFloat(c[22]);
    if (!lat || !lng || lat < 33 || lat > 39 || lng < 124 || lng > 132) continue;
    const name = c[4]?.replace(/"/g,"").trim();
    if (!name) continue;
    const addrRoad = c[5]?.replace(/"/g,"").trim();
    const addrJibun = c[6]?.replace(/"/g,"").trim();
    const addr = addrRoad || addrJibun || "";
    const openTime = c[18]?.replace(/"/g,"").trim() || "미확인";
    const maleStall = parseInt(c[7]) || 0;
    const femStall  = parseInt(c[13]) || 0;
    const maleAcc   = parseInt(c[9]) || 0;
    const diaper    = c[29]?.replace(/"/g,"").trim() === "Y";
    result.push({
      id: i, name, addr, region: getRegion(addr),
      type: getPlaceType(name), lat, lng,
      maleStall, femStall, stalls: maleStall + femStall,
      accessible: maleAcc > 0, babyRoom: diaper, diaper,
      openTime, hours: openTime,
      manager: c[16]?.replace(/"/g,"").trim(),
      phone:   c[17]?.replace(/"/g,"").trim(),
      owner:   c[23]?.replace(/"/g,"").trim(),
      paper: true, soap: true, bidet: false, dryer: false,
      crowd: (i % 3) + 1,
      clean: Math.round((3.0 + (i % 20) / 10) * 10) / 10,
      rating: Math.round((3.0 + (i % 18) / 10) * 10) / 10,
      reviews: [], distance: "-", floors: "1층", gender: "남/여",
    });
  }
  return result;
}

// ─────────────────────────────────────────
// 로고
// ─────────────────────────────────────────
function Logo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="lgBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF"/>
          <stop offset="100%" stopColor="#3B2F9E"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="26" fill="url(#lgBg)"/>
      <circle cx="30" cy="24" r="7" fill="#7DD3FC"/>
      <path d="M30 64 L18 33 L42 33 Z" fill="#7DD3FC"/>
      <circle cx="70" cy="24" r="7" fill="#FDA4AF"/>
      <path d="M70 33 L58 64 L82 64 Z" fill="#FDA4AF"/>
      <path d="M50 36 C46 36 42 40 42 44.5 C42 50.5 50 61 50 61 C50 61 58 50.5 58 44.5 C58 40 54 36 50 36Z" fill="#FF5A5F"/>
      <circle cx="50" cy="44.5" r="4" fill="white"/>
    </svg>
  );
}

// ─────────────────────────────────────────
// 공통 컴포넌트
// ─────────────────────────────────────────
function StarRow({ val, size = 13, interactive = false, onSet }: { val: number; size?: number; interactive?: boolean; onSet?: (v: number) => void }) {
  return (
    <span style={{display:"inline-flex",gap:1,cursor:interactive?"pointer":"default"}}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" onClick={() => interactive && onSet?.(i)}>
          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5"
            fill={i <= Math.round(val) ? "#E9A800" : "var(--color-border-tertiary)"}/>
        </svg>
      ))}
    </span>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap",
      background:ok?"var(--color-background-success)":"var(--color-background-secondary)",
      color:ok?"var(--color-text-success)":"var(--color-text-tertiary)",
      border:`0.5px solid ${ok?"var(--color-border-success)":"var(--color-border-tertiary)"}`}}>
      {ok?"✓":"✗"} {label}
    </span>
  );
}

function PlaceIcon({ type, size = 40 }: { type: string; size?: number }) {
  const ic = PLACE_ICONS[type] || PLACE_ICONS.default;
  return (
    <div style={{width:size,height:size,borderRadius:10,background:ic.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:size*0.45}}>
      {ic.emoji}
    </div>
  );
}

// ─────────────────────────────────────────
// 스플래시
// ─────────────────────────────────────────
function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    const t2 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{minHeight:600,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(160deg,#6C63FF 0%,#534AB7 55%,#3B2F9E 100%)",
      borderRadius:"var(--border-radius-lg)",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes lgIn{0%{transform:scale(0.4);opacity:0}65%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes lgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes lgFade{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes lgRipple{0%{transform:scale(0.6);opacity:0.3}100%{transform:scale(2.5);opacity:0}}
        @keyframes lgDot{0%,100%{opacity:0.25}50%{opacity:1}}
        @keyframes hwachelin-shine{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes hwachelin-glow{0%,100%{box-shadow:0 0 6px 2px #FFD70055}50%{box-shadow:0 0 16px 6px #FFD700aa}}
        @keyframes urgent-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes badge-pop{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes obIn{0%{opacity:0;transform:translateX(30px)}100%{opacity:1;transform:translateX(0)}}
        @keyframes permPop{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes dotPulse{0%,100%{opacity:0.3}50%{opacity:1}}
        .hwachelin-card{animation:hwachelin-glow 2.2s ease-in-out infinite;border:1px solid #E9A800 !important;}
        .hwachelin-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;background:linear-gradient(90deg,#FFD700,#FFA500,#FFD700,#FFA500);background-size:300% 100%;color:#4A2800;border:1px solid #E9A800;animation:hwachelin-shine 2.4s linear infinite;white-space:nowrap;}
        .live-dot{animation:dotPulse 1.2s ease-in-out infinite;}
      `}</style>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:240,height:240,borderRadius:"50%",border:"50px solid rgba(255,255,255,0.05)",animation:"lgRipple 2.6s ease-out infinite"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:340,height:340,borderRadius:"50%",border:"36px solid rgba(255,255,255,0.03)",animation:"lgRipple 2.6s ease-out 0.6s infinite"}}/>
      <div style={{animation:"lgIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards, lgFloat 3s ease-in-out 0.8s infinite",marginBottom:24}}>
        <Logo size={110}/>
      </div>
      <div style={{animation:"lgFade 0.5s ease forwards",textAlign:"center"}}>
        <p style={{fontSize:46,fontWeight:700,color:"white",margin:"0 0 2px",letterSpacing:6}}>응아</p>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.45)",margin:0,letterSpacing:8}}>EUNGA</p>
      </div>
      {phase >= 1 && (
        <div style={{animation:"lgFade 0.5s ease forwards",marginTop:16,textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{height:1,width:44,background:"rgba(255,255,255,0.3)"}}/>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.85)",margin:0,whiteSpace:"nowrap"}}>가장 빠른 공중화장실</p>
            <div style={{height:1,width:44,background:"rgba(255,255,255,0.3)"}}/>
          </div>
        </div>
      )}
      {phase >= 1 && (
        <div style={{position:"absolute",bottom:40,display:"flex",gap:7}}>
          {[0,1,2].map(i => <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,0.55)",animation:`lgDot 1.3s ease-in-out ${i*0.22}s infinite`}}/>)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// 온보딩
// ─────────────────────────────────────────
function Onboarding({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const ob = ONBOARDING_DATA[idx];
  return (
    <div style={{minHeight:600,display:"flex",flexDirection:"column",background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden"}}>
      <div style={{padding:"16px 20px",display:"flex",justifyContent:"flex-end"}}>
        <button onClick={onDone} style={{background:"none",border:"none",fontSize:13,color:"var(--color-text-tertiary)",cursor:"pointer"}}>건너뛰기</button>
      </div>
      <div key={idx} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 28px",animation:"obIn 0.4s ease forwards",textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:ob.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:28}}>{ob.icon}</div>
        <p style={{fontSize:22,fontWeight:500,margin:"0 0 14px",lineHeight:1.5,whiteSpace:"pre-line"}}>{ob.title}</p>
        <p style={{fontSize:14,color:"var(--color-text-secondary)",margin:0,lineHeight:1.7,whiteSpace:"pre-line"}}>{ob.desc}</p>
      </div>
      <div style={{padding:"24px 24px 36px"}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20}}>
          {ONBOARDING_DATA.map((_,i) => (
            <div key={i} onClick={() => setIdx(i)} style={{width:i===idx?24:8,height:8,borderRadius:4,background:i===idx?ob.color:"var(--color-border-tertiary)",transition:"all 0.3s ease",cursor:"pointer"}}/>
          ))}
        </div>
        <button onClick={() => idx < ONBOARDING_DATA.length-1 ? setIdx(idx+1) : onDone()}
          style={{width:"100%",padding:"15px 0",borderRadius:"var(--border-radius-lg)",fontSize:16,fontWeight:500,cursor:"pointer",background:ob.color,color:"white",border:"none"}}>
          {idx === ONBOARDING_DATA.length-1 ? "시작하기 →" : "다음"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 로그인
// ─────────────────────────────────────────
function LoginScreen({ onDone }: { onDone: () => void }) {
  return (
    <div style={{minHeight:600,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",padding:"0 28px",boxSizing:"border-box"}}>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><Logo size={72}/></div>
        <p style={{fontSize:24,fontWeight:500,margin:"0 0 8px",letterSpacing:2}}>응아</p>
        <p style={{fontSize:14,color:"var(--color-text-secondary)",margin:0}}>가장 빠른 공중화장실</p>
      </div>
      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
        <button onClick={onDone} style={{width:"100%",padding:"14px 0",borderRadius:"var(--border-radius-lg)",fontSize:15,fontWeight:500,cursor:"pointer",background:"#FEE500",color:"#3C1E1E",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          🟡 카카오로 시작하기
        </button>
        <button onClick={onDone} style={{width:"100%",padding:"14px 0",borderRadius:"var(--border-radius-lg)",fontSize:15,fontWeight:500,cursor:"pointer",background:"white",color:"#374151",border:"0.5px solid var(--color-border-secondary)",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          🔵 구글로 시작하기
        </button>
        <button onClick={onDone} style={{width:"100%",padding:"14px 0",borderRadius:"var(--border-radius-lg)",fontSize:15,fontWeight:500,cursor:"pointer",background:"#111",color:"white",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          🍎 Apple로 시작하기
        </button>
      </div>
      <button onClick={onDone} style={{background:"none",border:"none",fontSize:13,color:"var(--color-text-tertiary)",cursor:"pointer"}}>로그인 없이 둘러보기</button>
    </div>
  );
}

// ─────────────────────────────────────────
// 권한 화면
// ─────────────────────────────────────────
function PermissionScreen({ icon, title, desc, btnLabel, onDone, color }: {
  icon: string; title: string; desc: string; btnLabel: string; onDone: () => void; color: string;
}) {
  return (
    <div style={{minHeight:600,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",padding:"0 32px",boxSizing:"border-box",textAlign:"center"}}>
      <div style={{width:100,height:100,borderRadius:"50%",background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,marginBottom:28,animation:"permPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards"}}>{icon}</div>
      <p style={{fontSize:22,fontWeight:500,margin:"0 0 14px",lineHeight:1.4,whiteSpace:"pre-line"}}>{title}</p>
      <p style={{fontSize:14,color:"var(--color-text-secondary)",margin:"0 0 40px",lineHeight:1.7,whiteSpace:"pre-line"}}>{desc}</p>
      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={onDone} style={{width:"100%",padding:"15px 0",borderRadius:"var(--border-radius-lg)",fontSize:16,fontWeight:500,cursor:"pointer",background:color,color:"white",border:"none"}}>{btnLabel}</button>
        <button onClick={onDone} style={{width:"100%",padding:"13px 0",borderRadius:"var(--border-radius-lg)",fontSize:14,cursor:"pointer",background:"none",border:"0.5px solid var(--color-border-secondary)",color:"var(--color-text-secondary)"}}>나중에 설정하기</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// 메인 앱
// ─────────────────────────────────────────
function MainApp() {
  const [toilets, setToilets] = useState<Toilet[]>(SAMPLE_TOILETS);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [screen, setScreen] = useState("list");
  const [selected, setSelected] = useState<Toilet|null>(null);
  const [detailTab, setDetailTab] = useState("detail");
  const [region, setRegion] = useState("전체");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [navOpen, setNavOpen] = useState<number|null>(null);
  const [reportMode, setReportMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paperS, setPaperS] = useState<string|null>(null);
  const [soapS, setSoapS] = useState<string|null>(null);
  const [bidetS, setBidetS] = useState<string|null>(null);
  const [crowdI, setCrowdI] = useState(3);
  const [cleanI, setCleanI] = useState(3);
  const [reviewText, setReviewText] = useState("");
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [vending, setVending] = useState<string|null>(null);
  const [vendingLoc, setVendingLoc] = useState("");

  const onFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = ('dataTransfer' in e) ? e.dataTransfer?.files[0] : (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setLoading(true); setProgress("파일 읽는 중...");
    try {
      const buf = await file.arrayBuffer();
      setProgress("한글 디코딩 중...");
      const text = await decodeKorean(buf);
      setProgress("데이터 파싱 중...");
      await new Promise(r => setTimeout(r, 30));
      const data = parseCSV(text);
      setProgress(`${data.length.toLocaleString()}개 로드 완료!`);
      setToilets(data); setDataLoaded(true); setPage(1); setRegion("전체"); setSearch("");
    } catch(err) { setProgress("오류: " + err); }
    setLoading(false);
  }, []);

  const regions = useMemo(() => {
    const present = new Set(toilets.map(t => t.region));
    return REGION_ORDER.filter(r => r === "전체" || present.has(r));
  }, [toilets]);

  const filtered = useMemo(() => toilets.filter(t => {
    const mr = region === "전체" || t.region === region;
    const ms = !search || t.name.includes(search) || t.addr.includes(search) || (t.manager||"").includes(search);
    const mf = activeFilters.every(f => f === "hours24" ? t.hours.includes("24") : (t as any)[f]);
    return mr && ms && mf;
  }).sort((a,b) => a.crowd - b.crowd), [toilets, region, search, activeFilters]);

  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function openDetail(t: Toilet) {
    setSelected(t); setScreen("detail"); setDetailTab("detail");
    setReportMode(false); setSubmitted(false);
    setReviewSubmitted(false); setReviewText(""); setReviewScore(5);
  }

  function handleReport() {
    setToilets(ts => ts.map(t => t.id !== selected?.id ? t : {
      ...t,
      paper: paperS==="있음"?true:paperS==="없음"?false:t.paper,
      soap:  soapS==="있음"?true:soapS==="없음"?false:t.soap,
      bidet: bidetS==="있음"?true:bidetS==="없음"?false:t.bidet,
      crowd: crowdI, clean: Math.round((t.clean+cleanI)/2*10)/10,
      vendingMachine: vending==="있음"?true:vending==="없음"?false:t.vendingMachine,
      vendingMachineLocation: vending==="있음"&&vendingLoc ? vendingLoc : t.vendingMachineLocation,
    }));
    setSubmitted(true);
  }

  function handleReview() {
    if (!reviewText.trim()) return;
    const newR = {user:"나",score:reviewScore,text:reviewText,date:new Date().toISOString().slice(0,10)};
    setToilets(ts => ts.map(t => {
      if (t.id !== selected?.id) return t;
      const allR = [...t.reviews, newR];
      return {...t, reviews:allR, rating:Math.round(allR.reduce((a,r)=>a+r.score,0)/allR.length*10)/10};
    }));
    setSelected(s => s ? {...s, reviews:[...s.reviews,newR]} : s);
    setReviewSubmitted(true);
  }

  function openNaver(t: Toilet) { window.open(`https://map.naver.com/v5/directions/-/${t.lat},${t.lng},${encodeURIComponent(t.name)}/-/walk`,"_blank"); }
  function openKakao(t: Toilet) { window.open(`https://map.kakao.com/link/to/${encodeURIComponent(t.name)},${t.lat},${t.lng}`,"_blank"); }
  function openGoogle(t: Toilet) { window.open(`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=walking`,"_blank"); }

  function getNearbyStore(t: Toilet) { return CONV_STORES[t.id % CONV_STORES.length]; }
  function getCheer() { return CHEER_MSGS[Math.floor(Math.random()*CHEER_MSGS.length)]; }

  const sBt = (val:string, setter:React.Dispatch<React.SetStateAction<string|null>>, cur:string|null, label:string, colorOn:string) => (
    <button onClick={() => setter(cur===val?null:val)} style={{padding:"6px 14px",borderRadius:20,fontSize:13,cursor:"pointer",background:cur===val?colorOn:"var(--color-background-secondary)",color:cur===val?"white":"var(--color-text-secondary)",border:`0.5px solid ${cur===val?colorOn:"var(--color-border-tertiary)"}`,fontWeight:cur===val?500:400}}>{label}</button>
  );

  const TopBar = ({ title, onBack, extra }: { title:string; onBack?:()=>void; extra?: React.ReactNode }) => (
    <div style={{padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",gap:10}}>
      {onBack && <button onClick={onBack} style={{border:"none",background:"none",cursor:"pointer",fontSize:18,color:"var(--color-text-primary)",padding:0,lineHeight:1}}>←</button>}
      <span style={{fontWeight:500,fontSize:16,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</span>
      {extra}
    </div>
  );

  // CSV 업로드 화면
  if (!dataLoaded) return (
    <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-tertiary)",overflow:"hidden"}}>
      <TopBar title="🚻 응아 — 전국 화장실"/>
      <div style={{padding:20}}>
        <label onDragOver={e=>e.preventDefault()} onDrop={onFileUpload as any}
          style={{display:"block",border:"1.5px dashed var(--color-border-secondary)",borderRadius:"var(--border-radius-lg)",padding:"36px 20px",textAlign:"center",cursor:"pointer",background:"var(--color-background-secondary)"}}>
          <input type="file" accept=".csv" onChange={onFileUpload as any} style={{display:"none"}}/>
          <div style={{fontSize:40,marginBottom:12}}>📂</div>
          {loading ? (
            <><p style={{fontWeight:500,fontSize:14,margin:"0 0 6px"}}>처리 중...</p><p style={{fontSize:13,color:"var(--color-text-secondary)",margin:0}}>{progress}</p></>
          ) : (
            <><p style={{fontWeight:500,fontSize:15,margin:"0 0 6px"}}>공중화장실정보.csv 업로드</p><p style={{fontSize:12,color:"var(--color-text-secondary)",margin:"0 0 14px"}}>data.go.kr에서 받은 CSV 파일</p><div style={{display:"inline-block",padding:"9px 24px",borderRadius:"var(--border-radius-md)",background:"#534AB7",color:"white",fontSize:14,fontWeight:500}}>파일 선택</div></>
          )}
        </label>
        <div style={{textAlign:"center",margin:"14px 0"}}><span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>— 또는 —</span></div>
        <button onClick={() => { setToilets(SAMPLE_TOILETS); setDataLoaded(true); }} style={{width:"100%",padding:"11px 0",borderRadius:"var(--border-radius-md)",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",cursor:"pointer",fontSize:14,color:"var(--color-text-secondary)"}}>
          🗂 샘플 데이터로 시작하기
        </button>
      </div>
    </div>
  );

  // 상세 화면
  if (screen==="detail" && selected) {
    const cur = toilets.find(t=>t.id===selected.id) || selected;
    const isHwa = cur.rating >= HWACHELIN;
    const cc = URGENCY_COLORS[cur.crowd] || "#888";
    const ic = PLACE_ICONS[cur.type] || PLACE_ICONS.default;
    return (
      <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-tertiary)",overflow:"hidden"}}>
        <TopBar title={cur.name} onBack={() => setScreen("list")}/>
        <div style={{display:"flex",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
          {[["detail","상세정보"],["review",`리뷰 (${cur.reviews.length})`]].map(([key,label]) => (
            <button key={key} onClick={()=>setDetailTab(key)} style={{flex:1,padding:"10px 0",fontSize:13,cursor:"pointer",background:"none",border:"none",borderBottom:detailTab===key?"2px solid #534AB7":"2px solid transparent",color:detailTab===key?"#534AB7":"var(--color-text-secondary)",fontWeight:detailTab===key?500:400}}>{label}</button>
          ))}
        </div>

        {detailTab==="detail" && (
          <div style={{padding:16}}>
            {!reportMode ? (
              <>
                <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
                  <PlaceIcon type={cur.type} size={48}/>
                  <div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:ic.bg,color:ic.color,border:`0.5px solid ${ic.color}40`,fontWeight:500}}>{ic.emoji} {ic.label}</span>
                      {isHwa && <span className="hwachelin-badge">🚽 화슐랭</span>}
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#F1EFE8",color:"#5F5E5A"}}>{cur.region}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}><StarRow val={cur.rating} size={14}/><span style={{fontSize:13,fontWeight:500}}>{cur.rating.toFixed(1)}</span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>({cur.reviews.length}개 리뷰)</span></div>
                    <p style={{fontSize:12,color:"var(--color-text-secondary)",margin:"4px 0 0"}}>{cur.addr}</p>
                  </div>
                </div>

                {/* 긴급 카드 */}
                <div style={{background:cur.crowd>=4?"#FFF5F5":cur.crowd>=3?"#FFFBEA":"#F0FAF5",border:`1px solid ${cc}44`,borderRadius:"var(--border-radius-lg)",padding:"14px 16px",marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",margin:"0 0 10px"}}>🚨 지금 당장 필요해요?</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
                    <div style={{background:"white",borderRadius:"var(--border-radius-md)",padding:"10px 8px",textAlign:"center",border:`1px solid ${cc}55`}}>
                      <p style={{fontSize:10,color:"var(--color-text-secondary)",margin:"0 0 4px"}}>혼잡도</p>
                      <div style={{fontSize:20,marginBottom:2}}>{cur.crowd<=1?"😌":cur.crowd===2?"🙂":cur.crowd===3?"😐":cur.crowd===4?"😬":"😱"}</div>
                      <p style={{fontSize:11,fontWeight:500,color:cc,margin:0}}>{CROWD_LABELS[cur.crowd]}</p>
                    </div>
                    <div style={{background:"white",borderRadius:"var(--border-radius-md)",padding:"10px 8px",textAlign:"center",border:"0.5px solid var(--color-border-tertiary)"}}>
                      <p style={{fontSize:10,color:"var(--color-text-secondary)",margin:"0 0 4px"}}>도보시간</p>
                      <p style={{fontSize:20,fontWeight:500,color:"#534AB7",margin:"0 0 2px",lineHeight:1}}>{cur.distance==="-"?"?":cur.distance}</p>
                      <p style={{fontSize:11,color:"var(--color-text-secondary)",margin:0}}>분 도보</p>
                    </div>
                    <div style={{background:"white",borderRadius:"var(--border-radius-md)",padding:"10px 8px",textAlign:"center",border:"0.5px solid var(--color-border-tertiary)"}}>
                      <p style={{fontSize:10,color:"var(--color-text-secondary)",margin:"0 0 4px"}}>화장지</p>
                      <div style={{fontSize:20,marginBottom:2}}>{cur.paper?"🧻":"❌"}</div>
                      <p style={{fontSize:11,fontWeight:500,color:cur.paper?"#1D9E75":"#D85A30",margin:"0 0 4px"}}>{cur.paper?"있음":"없음"}</p>
                      <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:4}}>
                        <p style={{fontSize:10,color:"var(--color-text-secondary)",margin:"0 0 2px"}}>비데</p>
                        <p style={{fontSize:11,fontWeight:500,color:cur.bidet?"#1D9E75":"var(--color-text-tertiary)",margin:0}}>{cur.bidet?"🚿 있음":"없음"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 길찾기 + 휴지자판기 */}
                <div style={{marginBottom:12,padding:12,borderRadius:"var(--border-radius-md)",background:cur.vendingMachine?"#F0FAF5":"var(--color-background-secondary)",border:`0.5px solid ${cur.vendingMachine?"var(--color-border-success)":"var(--color-border-tertiary)"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <p style={{fontSize:13,fontWeight:500,margin:"0 0 2px"}}>🧻 주변 휴지 자판기</p>
                      <p style={{fontSize:12,color:cur.vendingMachine?"var(--color-text-success)":"var(--color-text-secondary)",margin:0}}>{cur.vendingMachine?"✓ "+cur.vendingMachineLocation:"정보 없음 — 아래서 제보해주세요!"}</p>
                    </div>
                    <span style={{fontSize:24}}>{cur.vendingMachine?"✅":"❓"}</span>
                  </div>
                </div>

                <div style={{marginBottom:14}}>
                  <p style={{fontSize:13,fontWeight:500,margin:"0 0 8px"}}>시설 현황</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    <Badge ok={cur.paper} label="화장지"/><Badge ok={cur.bidet} label="비데"/>
                    <Badge ok={cur.soap} label="비누"/><Badge ok={cur.dryer} label="핸드드라이어"/>
                    <Badge ok={cur.diaper} label="기저귀 교환대"/><Badge ok={cur.accessible} label="장애인 접근"/>
                    <Badge ok={cur.babyRoom} label="아기의자"/>
                  </div>
                </div>

                <button onClick={() => { setReportMode(true); setSubmitted(false); }} style={{width:"100%",padding:"12px 0",borderRadius:"var(--border-radius-md)",background:"#534AB7",color:"white",border:"none",cursor:"pointer",fontSize:14,fontWeight:500}}>현재 상태 업데이트</button>
              </>
            ) : submitted ? (
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <div style={{fontSize:40,marginBottom:12}}>✅</div>
                <p style={{fontWeight:500,fontSize:16,margin:"0 0 6px"}}>업데이트 완료!</p>
                <p style={{fontSize:13,color:"var(--color-text-secondary)",margin:"0 0 20px"}}>소중한 정보 감사합니다.</p>
                <button onClick={() => { setReportMode(false); setSubmitted(false); }} style={{padding:"10px 24px",borderRadius:"var(--border-radius-md)",background:"#534AB7",color:"white",border:"none",cursor:"pointer",fontSize:14}}>돌아가기</button>
              </div>
            ) : (
              <>
                {[["🧻","화장지",setPaperS,paperS,[["있음","있음","#1D9E75"],["부족","부족","#E9A800"],["없음","없음","#D85A30"]]],
                  ["🚿","비데",setBidetS,bidetS,[["있음","있음","#1D9E75"],["없음","없음","#D85A30"]]],
                  ["🧼","비누",setSoapS,soapS,[["있음","있음","#1D9E75"],["없음","없음","#D85A30"]]]].map(([icon,label,setter,cur,opts]:[any,any,any,any,any]) => (
                  <div key={label} style={{marginBottom:14}}>
                    <p style={{fontSize:13,color:"var(--color-text-secondary)",margin:"0 0 8px"}}>{icon} {label}</p>
                    <div style={{display:"flex",gap:8}}>{opts.map(([v,l,c]:any) => sBt(v,setter,cur,l,c))}</div>
                  </div>
                ))}
                <div style={{marginBottom:14,padding:12,background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)"}}>
                  <p style={{fontSize:13,fontWeight:500,margin:"0 0 8px"}}>🧻 주변 휴지 자판기</p>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>{sBt("있음",setVending,vending,"있음","#1D9E75")}{sBt("없음",setVending,vending,"없음","#D85A30")}{sBt("모름",setVending,vending,"모름","#888")}</div>
                  {vending==="있음" && <input value={vendingLoc} onChange={e=>setVendingLoc(e.target.value)} placeholder="위치를 알려주세요" style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",borderRadius:"var(--border-radius-md)",fontSize:13}}/>}
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:"var(--color-text-secondary)"}}>청결도</span><StarRow val={cleanI} size={15}/></div>
                  <input type="range" min={1} max={5} step={1} value={cleanI} onChange={e=>setCleanI(Number(e.target.value))} style={{width:"100%"}}/>
                </div>
                <div style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:"var(--color-text-secondary)"}}>혼잡도</span><span style={{fontSize:12,color:URGENCY_COLORS[crowdI]}}>{CROWD_LABELS[crowdI]}</span></div>
                  <input type="range" min={1} max={5} step={1} value={crowdI} onChange={e=>setCrowdI(Number(e.target.value))} style={{width:"100%"}}/>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setReportMode(false)} style={{flex:1,padding:"11px 0",borderRadius:"var(--border-radius-md)",background:"none",border:"0.5px solid var(--color-border-secondary)",cursor:"pointer",fontSize:14,color:"var(--color-text-secondary)"}}>취소</button>
                  <button onClick={handleReport} style={{flex:2,padding:"11px 0",borderRadius:"var(--border-radius-md)",background:"#534AB7",color:"white",border:"none",cursor:"pointer",fontSize:14,fontWeight:500}}>제출하기</button>
                </div>
              </>
            )}
          </div>
        )}

        {detailTab==="review" && (
          <div style={{padding:16}}>
            {!reviewSubmitted ? (
              <div style={{marginBottom:16,padding:14,background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)"}}>
                <p style={{fontSize:13,fontWeight:500,margin:"0 0 8px"}}>리뷰 작성</p>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><StarRow val={reviewScore} size={22} interactive onSet={setReviewScore}/><span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{reviewScore}점</span></div>
                <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="사용 후기를 남겨주세요..." style={{width:"100%",boxSizing:"border-box",height:70,padding:"8px 10px",borderRadius:"var(--border-radius-md)",fontSize:13,resize:"none",border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}/>
                <button onClick={handleReview} style={{width:"100%",marginTop:8,padding:"9px 0",borderRadius:"var(--border-radius-md)",background:"#534AB7",color:"white",border:"none",cursor:"pointer",fontSize:13,fontWeight:500}}>리뷰 등록</button>
              </div>
            ) : (
              <div style={{marginBottom:16,padding:12,background:"var(--color-background-success)",borderRadius:"var(--border-radius-md)",textAlign:"center"}}><span style={{fontSize:13,color:"var(--color-text-success)"}}>✓ 업데이트 완료!</span></div>
            )}
            {cur.reviews.length === 0 ? <p style={{textAlign:"center",color:"var(--color-text-tertiary)",fontSize:13,padding:"20px 0"}}>아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>
            : cur.reviews.slice().reverse().map((r,i) => (
              <div key={i} style={{padding:"12px 0",borderBottom:i<cur.reviews.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:"#EEEDFE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:"#534AB7"}}>{r.user.slice(0,1)}</div>
                    <span style={{fontSize:13,fontWeight:500}}>{r.user}</span><StarRow val={r.score} size={11}/>
                  </div>
                  <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{r.date}</span>
                </div>
                <p style={{fontSize:13,color:"var(--color-text-secondary)",margin:0,lineHeight:1.6}}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 목록 화면
  return (
    <div style={{background:"var(--color-background-primary)",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-tertiary)",overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",gap:10}}>
        <Logo size={32}/>
        <div style={{flex:1}}>
          <p style={{fontWeight:700,fontSize:16,margin:0,letterSpacing:2}}>응아</p>
          <p style={{fontSize:10,color:"var(--color-text-tertiary)",margin:0}}>가장 빠른 공중화장실</p>
        </div>
        <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{filtered.length.toLocaleString()}개</span>
      </div>

      <div style={{padding:"10px 16px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="화장실명 또는 주소 검색..." style={{width:"100%",boxSizing:"border-box",padding:"9px 12px",borderRadius:"var(--border-radius-md)",fontSize:14,marginBottom:8}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {regions.map(r => (
            <button key={r} onClick={()=>{setRegion(r);setPage(1);}} style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",background:region===r?"#534AB7":"var(--color-background-secondary)",color:region===r?"white":"var(--color-text-secondary)",border:`0.5px solid ${region===r?"#534AB7":"var(--color-border-tertiary)"}`,fontWeight:region===r?500:400}}>
              {r==="전체"?"전체":r}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {FILTER_KEYS.map((k,i) => {
            const labels = ["휴지 있음","비누 있음","비데 있음","장애인용","기저귀 교환대","24시간"];
            return (
              <button key={k} onClick={()=>{setActiveFilters(f=>f.includes(k)?f.filter(x=>x!==k):[...f,k]);setPage(1);}} style={{padding:"3px 8px",borderRadius:20,fontSize:11,cursor:"pointer",background:activeFilters.includes(k)?"#EEEDFE":"var(--color-background-secondary)",color:activeFilters.includes(k)?"#534AB7":"var(--color-text-secondary)",border:`0.5px solid ${activeFilters.includes(k)?"#534AB7":"var(--color-border-tertiary)"}`,fontWeight:activeFilters.includes(k)?500:400}}>
                {labels[i]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {paged.length===0 ? <p style={{textAlign:"center",color:"var(--color-text-tertiary)",fontSize:14,padding:"32px 0"}}>검색 결과가 없습니다</p>
        : paged.map((t,i) => {
          const ic = PLACE_ICONS[t.type]||PLACE_ICONS.default;
          const tcc = URGENCY_COLORS[t.crowd]||"#888";
          const isHwa = t.rating >= HWACHELIN;
          return (
            <div key={t.id} onClick={()=>openDetail(t)} className={isHwa?"hwachelin-card":""} style={{padding:"11px 14px",borderBottom:i<paged.length-1?"0.5px solid var(--color-border-tertiary)":"none",cursor:"pointer",background:isHwa?"#FFFBEA":"var(--color-background-primary)",display:"flex",gap:10,alignItems:"flex-start"}}>
              <PlaceIcon type={t.type} size={40}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2,flexWrap:"wrap"}}>
                  <span style={{fontWeight:500,fontSize:14,color:isHwa?"#7A4800":"var(--color-text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{t.name}</span>
                  {isHwa && <span className="hwachelin-badge">🚽 화슐랭</span>}
                </div>
                <p style={{fontSize:11,color:"var(--color-text-secondary)",margin:"0 0 6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.addr}</p>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:6}}>
                  <div style={{padding:"3px 8px",borderRadius:20,background:tcc+"18",border:`1px solid ${tcc}44`,display:"flex",alignItems:"center",gap:3}}>
                    <span style={{fontSize:12}}>{t.crowd<=1?"😌":t.crowd===2?"🙂":t.crowd===3?"😐":t.crowd===4?"😬":"😱"}</span>
                    <span style={{fontSize:11,fontWeight:500,color:tcc}}>{CROWD_LABELS[t.crowd]}</span>
                  </div>
                  <div style={{padding:"3px 8px",borderRadius:20,background:t.paper?"#F0FAF5":"#FFF0F0",border:`0.5px solid ${t.paper?"#9FE1CB":"#F09595"}`,display:"flex",alignItems:"center",gap:3}}>
                    <span style={{fontSize:11}}>🧻</span>
                    <span style={{fontSize:11,fontWeight:500,color:t.paper?"#1D9E75":"#D85A30"}}>{t.paper?"있음":"없음"}</span>
                  </div>
                  {t.bidet && <div style={{padding:"3px 8px",borderRadius:20,background:"#E6F1FB",border:"0.5px solid #85B7EB"}}><span style={{fontSize:11,color:"#185FA5",fontWeight:500}}>🚿 비데</span></div>}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                <StarRow val={t.rating} size={11}/>
                <p style={{fontSize:12,fontWeight:500,margin:0}}>{t.rating.toFixed(1)}</p>
                <p style={{fontSize:10,color:"var(--color-text-tertiary)",margin:0}}>{t.region}</p>
                <button onClick={e=>{e.stopPropagation();setNavOpen(t.id);}} style={{marginTop:2,padding:"3px 8px",borderRadius:20,fontSize:11,fontWeight:500,cursor:"pointer",background:"#534AB7",color:"white",border:"none",display:"inline-flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
                  🗺 길찾기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{padding:"10px 16px",borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:"5px 12px",borderRadius:"var(--border-radius-md)",fontSize:13,cursor:page===1?"default":"pointer",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",color:page===1?"var(--color-text-tertiary)":"var(--color-text-primary)"}}>← 이전</button>
          {Array.from({length:Math.min(5,totalPages)},(_,i)=>{ const p=page<=3?i+1:page+i-2; if(p>totalPages) return null; return <button key={p} onClick={()=>setPage(p)} style={{padding:"5px 10px",borderRadius:"var(--border-radius-md)",fontSize:13,cursor:"pointer",background:page===p?"#534AB7":"var(--color-background-secondary)",color:page===p?"white":"var(--color-text-primary)",border:`0.5px solid ${page===p?"#534AB7":"var(--color-border-tertiary)"}`}}>{p}</button>; })}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:"5px 12px",borderRadius:"var(--border-radius-md)",fontSize:13,cursor:page===totalPages?"default":"pointer",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",color:page===totalPages?"var(--color-text-tertiary)":"var(--color-text-primary)"}}>다음 →</button>
        </div>
      )}

      <div style={{padding:"10px 16px",borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:8}}>
        <button onClick={()=>{setDataLoaded(false);setToilets([]);}} style={{flex:1,padding:"10px 0",borderRadius:"var(--border-radius-md)",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",cursor:"pointer",fontSize:13,color:"var(--color-text-secondary)"}}>📂 다시 업로드</button>
      </div>

      {/* 길찾기 팝업 */}
      {navOpen !== null && (() => {
        const t = toilets.find(x=>x.id===navOpen);
        if (!t) return null;
        const store = getNearbyStore(t);
        const noPaper = !t.paper;
        const cheer = getCheer();
        const storeWalk = store.walk;
        const toiletWalk = Math.max(1, Math.round((parseInt(t.distance)||300)/80) - storeWalk + 2);
        const totalWalk = storeWalk + 1 + toiletWalk;
        return (
          <div onClick={()=>setNavOpen(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"var(--color-background-primary)",borderRadius:"20px 20px 0 0",padding:"20px 20px 28px",width:"100%",maxWidth:420,boxSizing:"border-box"}}>
              <div style={{width:40,height:4,borderRadius:2,background:"var(--color-border-secondary)",margin:"0 auto 14px"}}/>
              <div style={{background:"#EEEDFE",borderRadius:"var(--border-radius-md)",padding:"10px 14px",marginBottom:14,textAlign:"center"}}>
                <p style={{fontSize:14,fontWeight:500,color:"#534AB7",margin:0}}>{cheer}</p>
              </div>
              <p style={{fontWeight:500,fontSize:15,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🚻 {t.name}</p>
              <p style={{fontSize:12,color:"var(--color-text-secondary)",margin:"0 0 14px"}}>{t.region}</p>
              {noPaper ? (
                <>
                  <div style={{background:"#FFF5F5",border:"1px solid #F09595",borderRadius:"var(--border-radius-md)",padding:"10px 14px",marginBottom:10}}>
                    <p style={{fontSize:13,fontWeight:500,color:"#A32D2D",margin:"0 0 4px"}}>⚠️ 이 화장실은 화장지가 없어요!</p>
                    <p style={{fontSize:12,color:"var(--color-text-secondary)",margin:0}}>근처 편의점에서 먼저 구매하는 걸 추천해요</p>
                  </div>
                  <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"12px 14px",marginBottom:10}}>
                    <p style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",margin:"0 0 10px"}}>🗺 추천 경로 (총 약 {totalWalk}분)</p>
                    {[
                      {dot:"#534AB7",line:"#534AB7",title:"📍 현재 위치",sub:"출발"},
                      {dot:"#E9A800",line:"#E9A800",title:`${store.emoji} ${store.name}`,sub:`도보 ${storeWalk}분 · ${store.dist} — 🧻 화장지 구매`},
                      {dot:"#1D9E75",line:null,title:`🚻 ${t.name}`,sub:`편의점에서 도보 ${toiletWalk}분 — 🎯 도착!`},
                    ].map((s,i) => (
                      <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<2?6:0}}>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                          <div style={{width:10,height:10,borderRadius:"50%",background:s.dot,flexShrink:0,marginTop:2}}/>
                          {s.line && <div style={{width:2,height:22,background:s.line,opacity:0.3}}/>}
                        </div>
                        <div><p style={{fontSize:13,fontWeight:500,margin:"0 0 1px"}}>{s.title}</p><p style={{fontSize:11,color:"var(--color-text-tertiary)",margin:0}}>{s.sub}</p></div>
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:12,fontWeight:500,margin:"0 0 8px"}}>🛣 편의점 경유 길찾기</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
                    {[["🟢 네이버맵으로 경유 길찾기","#03C75A","white",()=>openNaver(t)],["🟡 카카오맵으로 경유 길찾기","#FEE500","#3C1E1E",()=>openKakao(t)],["🔵 구글맵으로 경유 길찾기","#4285F4","white",()=>openGoogle(t)]].map(([label,bg,color,fn]:[any,any,any,any]) => (
                      <button key={label} onClick={()=>{fn();setNavOpen(null);}} style={{width:"100%",padding:"12px",borderRadius:"var(--border-radius-md)",fontSize:14,fontWeight:500,cursor:"pointer",background:bg,color,border:"none"}}>{label}</button>
                    ))}
                  </div>
                  <p style={{fontSize:12,fontWeight:500,margin:"0 0 8px",color:"var(--color-text-secondary)"}}>🚽 바로 화장실로만 가기</p>
                  <div style={{display:"flex",gap:8}}>
                    {[["🟢 네이버","#03C75A","white",()=>openNaver(t)],["🟡 카카오","#FEE500","#3C1E1E",()=>openKakao(t)],["🔵 구글","#4285F4","white",()=>openGoogle(t)]].map(([label,bg,color,fn]:[any,any,any,any]) => (
                      <button key={label} onClick={()=>{fn();setNavOpen(null);}} style={{flex:1,padding:"10px 0",borderRadius:"var(--border-radius-md)",fontSize:12,fontWeight:500,cursor:"pointer",background:bg,color,border:"none"}}>{label}</button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[["🟢 네이버맵으로 길찾기","#03C75A","white",()=>openNaver(t)],["🟡 카카오맵으로 길찾기","#FEE500","#3C1E1E",()=>openKakao(t)],["🔵 구글맵으로 길찾기","#4285F4","white",()=>openGoogle(t)]].map(([label,bg,color,fn]:[any,any,any,any]) => (
                    <button key={label} onClick={()=>{fn();setNavOpen(null);}} style={{width:"100%",padding:"14px",borderRadius:"var(--border-radius-md)",fontSize:15,fontWeight:500,cursor:"pointer",background:bg,color,border:"none"}}>{label}</button>
                  ))}
                </div>
              )}
              <button onClick={()=>setNavOpen(null)} style={{width:"100%",marginTop:10,padding:"12px",borderRadius:"var(--border-radius-md)",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",cursor:"pointer",fontSize:14,color:"var(--color-text-secondary)"}}>취소</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────
// 메인 앱 진입점
// ─────────────────────────────────────────
const FLOW = ["splash","onboarding","login","location","notification","main"];

export default function App() {
  const [screen, setScreen] = useState("splash");
  const next = (s: string) => setScreen(s);

  return (
    <div style={{maxWidth:420,margin:"0 auto",padding:"0 0 16px"}}>
      <style>{`@keyframes screenIn{0%{opacity:0;transform:scale(0.97)}100%{opacity:1;transform:scale(1)}}`}</style>

      {screen !== "splash" && (
        <div style={{display:"flex",gap:4,marginBottom:8,justifyContent:"center",padding:"8px 0"}}>
          {FLOW.slice(1).map(s => {
            const done = FLOW.indexOf(screen) >= FLOW.indexOf(s);
            return <div key={s} style={{width:32,height:3,borderRadius:2,background:done?"#6C63FF":"var(--color-border-tertiary)",transition:"all 0.3s"}}/>;
          })}
        </div>
      )}

      <div key={screen} style={{animation:"screenIn 0.35s ease forwards"}}>
        {screen==="splash"      && <Splash onDone={()=>next("onboarding")}/>}
        {screen==="onboarding"  && <Onboarding onDone={()=>next("login")}/>}
        {screen==="login"       && <LoginScreen onDone={()=>next("location")}/>}
        {screen==="location"    && <PermissionScreen icon="📍" color="#6C63FF" title={"위치 정보 사용을\n허용해 주세요"} desc={"주변 화장실을 찾으려면\n현재 위치 접근이 필요해요."} btnLabel="위치 접근 허용하기" onDone={()=>next("notification")}/>}
        {screen==="notification"&& <PermissionScreen icon="🔔" color="#FF5A5F" title={"알림을\n허용해 주세요"} desc={"혼잡도 변화, 포인트 적립 알림을\n받을 수 있어요."} btnLabel="알림 허용하기" onDone={()=>next("main")}/>}
        {screen==="main"        && <MainApp/>}
      </div>

      {/* 화면 이동 네비 */}
      <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
        {[["스플래시","splash"],["온보딩","onboarding"],["로그인","login"],["위치권한","location"],["알림권한","notification"],["메인앱","main"]].map(([label,s]) => (
          <button key={s} onClick={()=>setScreen(s)} style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",background:screen===s?"#6C63FF":"var(--color-background-secondary)",color:screen===s?"white":"var(--color-text-secondary)",border:"0.5px solid var(--color-border-tertiary)"}}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}