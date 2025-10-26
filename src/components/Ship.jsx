import React from "react";

export default function Ship({ name, pirate, color, progress, isWinner }) {
  const translateX = `${Math.min(100, progress * 92)}%`;
  return (
    <div className="ship-row">
      <div className="ship-label">
        <div className="ship-name">{name}</div>
        <div className="ship-pirate">{pirate}</div>
      </div>
      <div className="ship-track">
        <div
          className={`ship ${isWinner ? "winner" : ""}`}
          style={{ transform: `translateX(${translateX})`, borderColor: color }}
        >
          <div className="ship-flag" style={{ background: color }} />
          <div className="ship-body" />
        </div>
      </div>
    </div>
  );
}
