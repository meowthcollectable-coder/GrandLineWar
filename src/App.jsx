import React, { useEffect, useState, useRef } from "react";
import { fetchSheet } from "./api/sheets";
import Ship from "./components/Ship";
import { Howl } from "howler";
import { SOUND_URLS } from "./sounds";
import "./styles.css";

const SHEET_ID = "1P05Uw_P7rfapZcO0KLz5wAa1Rjnp6h5XmK3yOGSnZLo"; // your sheet

function parseRows(rows) {
  // expects columns: Nome, Pirata, Punti
  return rows.map(r => ({
    name: r.Nome || r.Name || r[Object.keys(r)[0]],
    pirate: r.Pirata || r.Pirate || r[Object.keys(r)[1]] || "",
    points: Number(r.Punti || r.Points || r[Object.keys(r)[2]] || 0)
  })).filter(x => !!x.name);
}

export default function App() {
  const [players, setPlayers] = useState([]);
  const [maxPoints, setMaxPoints] = useState(1);
  const ambientRef = useRef(null);
  const dingRef = useRef(null);
  const boomRef = useRef(null);
  const finishRef = useRef(null);

  // load sounds
  useEffect(() => {
    ambientRef.current = new Howl({ src: [SOUND_URLS.ambient], loop: true, volume: 0.25, html5: true });
    dingRef.current = new Howl({ src: [SOUND_URLS.ding], volume: 1.0, html5: true });
    boomRef.current = new Howl({ src: [SOUND_URLS.boom], volume: 1.0, html5: true });
    finishRef.current = new Howl({ src: [SOUND_URLS.finish], volume: 1.0, html5: true });
    // iOS requires a user gesture to start audio
    const startAmbientOnTouch = () => {
      if (ambientRef.current && !ambientRef.current.playing()) ambientRef.current.play();
      window.removeEventListener("touchstart", startAmbientOnTouch);
      window.removeEventListener("click", startAmbientOnTouch);
    };
    window.addEventListener("touchstart", startAmbientOnTouch, { once: true });
    window.addEventListener("click", startAmbientOnTouch, { once: true });
  }, []);

  // periodic fetch
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const rows = await fetchSheet(SHEET_ID, 0);
        const parsed = parseRows(rows);
        if (!cancelled) {
          setPlayers(prev => {
            // play sounds for differences
            parsed.forEach(p => {
              const before = prev.find(x => x.name === p.name);
              if (before) {
                if (p.points > before.points) dingRef.current && dingRef.current.play();
                if (p.points < before.points) boomRef.current && boomRef.current.play();
              }
            });
            return parsed;
          });
          const max = Math.max(1, ...parsed.map(p => p.points || 0));
          setMaxPoints(max);
        }
      } catch (e) {
        console.error("Sheet fetch error", e);
      }
    }
    poll();
    const id = setInterval(poll, 10000); // every 10s
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // finish race
  const handleFinish = () => {
    if (!players.length) return;
    const winner = [...players].sort((a,b)=> b.points - a.points)[0];
    finishRef.current && finishRef.current.play();
    setPlayers(ps => ps.map(p => p.name === winner.name ? { ...p, _forceWin: true } : p));
    // fade ambient
    if (ambientRef.current) {
      let vol = ambientRef.current.volume();
      const fade = setInterval(()=> {
        vol -= 0.05;
        if (vol <= 0.02) { ambientRef.current.stop(); clearInterval(fade); }
        else ambientRef.current.volume(vol);
      }, 200);
    }
  };

  const normalize = (points) => Math.min(1, (points / Math.max(1, maxPoints)));

  return (
    <div className="app">
      <div className="left-panel">
        <h1>Grand Line War</h1>
        <div className="leaderboard">
          {players.map(p => (
            <div key={p.name} className="leader-row">
              <div className="leader-name">{p.name}</div>
              <div className="leader-points">{p.points}</div>
              <div className="leader-bar"><div style={{width: `${(p.points/maxPoints)*100}%`}}/></div>
            </div>
          ))}
        </div>
        <div className="controls-bottom">
          <button onClick={handleFinish} className="finish-btn">🏝️ Fine Gara</button>
        </div>
      </div>

      <div className="race-area">
        <div className="sea-bg">
          <img src="/assets/island.svg" className="island" alt="island"/>
          <div className="ships">
            {players.map(p => {
              const progress = p._forceWin ? 1.05 : normalize(p.points);
              const color = "#" + ((Math.abs(hashCode(p.name))>>>0)&0xFFFFFF).toString(16).padStart(6,'0');
              return <Ship
                key={p.name}
                name={p.name}
                pirate={p.pirate}
                color={color}
                progress={progress}
                isWinner={!!p._forceWin}
              />
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function hashCode(str) {
  let h = 0;
  for (let i=0;i<str.length;i++) h = (h<<5)-h + str.charCodeAt(i) | 0;
  return h;
}
