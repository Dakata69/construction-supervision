import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

// Simple SVG building block generator
const Building: React.FC<{ w: number; h: number; color: string; windows?: React.ReactNode }> = ({ w, h, color, windows }) => (
  <g>
    <rect width={w} height={h} x={0} y={180 - h} fill={color} rx={2} />
    {windows}
  </g>
);

const layerPalette = {
  far: ['#b0bec5', '#b0c4cc', '#a7b8c0'],
  mid: ['#90a4ae', '#94a9b3', '#8da0aa'],
  near: ['#78909c', '#7f97a3', '#6f8590']
};

function generateLayer(seed: number, palette: string[], withLights = false) {
  const buildings = [] as React.ReactNode[];
  const rnd = (min: number, max: number) => {
    seed = (seed * 9301 + 49297) % 233280;
    const r = seed / 233280;
    return Math.floor(min + r * (max - min));
  };
  let cursor = 0;
  while (cursor < 900) {
    const w = rnd(30, 80);
    const h = rnd(40, 150);
    const color = palette[rnd(0, palette.length - 1)];
    let windows: React.ReactNode = null;
    if (withLights && h > 70 && w > 35) {
      const windowGroup: React.ReactNode[] = [];
      const rows = Math.max(2, Math.floor(h / 35));
      const cols = Math.max(2, Math.floor(w / 20));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Randomly decide if window exists
          if ((r + c + seed) % 3 === 0) {
            const wx = 4 + c * (w - 8) / cols;
            const wy = (180 - h) + 6 + r * (h - 12) / rows;
            const cls = (r + c) % 2 === 0 ? 'window-light bright' : 'window-light dim';
            windowGroup.push(<rect key={`w-${cursor}-${r}-${c}`} x={wx} y={wy} width={Math.max(6, (w - 16) / cols - 2)} height={8} className={cls} rx={1} />);
          }
        }
      }
      windows = <g>{windowGroup}</g>;
    }
    buildings.push(
      <g key={cursor + '-' + h} transform={`translate(${cursor},0)`}>
        <Building w={w} h={h} color={color} windows={windows} />
      </g>
    );
    cursor += w + rnd(8, 24);
  }
  return buildings;
}

// Generate static star positions so they don't change on re-render
const generateStars = (count: number, seed: number) => {
  const stars: React.ReactNode[] = [];
  const w = 2000; // cover wide area
  const h = 600;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * h * 0.5); // upper half
    const r = rnd() * 1.6 + 0.4;
    const twinkleDelay = (rnd() * 6).toFixed(2) + 's';
    stars.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r={r}
        className="star"
        style={{ animationDelay: twinkleDelay }}
      />
    );
  }
  return (
    <svg width={w} height={h} className="stars-svg" aria-hidden="true">
      {stars}
    </svg>
  );
};

export const AnimatedCityBackground: React.FC = () => {
  const dayNightEnabled = useSelector((state: RootState) => state.ui.dayNightCycleEnabled);
  return (
    <div className={`background-city-wrapper ${dayNightEnabled ? 'night' : 'day'}`} aria-hidden="true">
      <div className={`background-day-night ${dayNightEnabled ? 'night' : 'day'}`} />
      <div className="celestial-container">
        <div className="celestial" />
      </div>
      {dayNightEnabled && (
        <div className="background-stars-layer">
          {generateStars(160, 421)}
        </div>
      )}
      <div className="background-city-overlay" />
      {/* Far layer (duplicated for seamless loop) */}
      <div className="background-city-layer city-layer-far">
        <div className="background-city-sequence">
          <svg width={900} height={180}>{generateLayer(11, layerPalette.far)}</svg>
          <svg width={900} height={180}>{generateLayer(19, layerPalette.far)}</svg>
          <svg width={900} height={180}>{generateLayer(23, layerPalette.far)}</svg>
        </div>
        <div className="background-city-sequence">
          <svg width={900} height={180}>{generateLayer(11, layerPalette.far)}</svg>
          <svg width={900} height={180}>{generateLayer(19, layerPalette.far)}</svg>
          <svg width={900} height={180}>{generateLayer(23, layerPalette.far)}</svg>
        </div>
      </div>
      {/* Mid layer */}
      <div className="background-city-layer city-layer-mid">
        <div className="background-city-sequence">
          <svg width={900} height={180}>{generateLayer(31, layerPalette.mid)}</svg>
          <svg width={900} height={180}>{generateLayer(37, layerPalette.mid)}</svg>
          <svg width={900} height={180}>{generateLayer(41, layerPalette.mid)}</svg>
        </div>
        <div className="background-city-sequence">
          <svg width={900} height={180}>{generateLayer(31, layerPalette.mid)}</svg>
          <svg width={900} height={180}>{generateLayer(37, layerPalette.mid)}</svg>
          <svg width={900} height={180}>{generateLayer(41, layerPalette.mid)}</svg>
        </div>
      </div>
      {/* Near layer */}
      <div className="background-city-layer city-layer-near">
        <div className="background-city-sequence">
          <svg width={900} height={180}>{generateLayer(53, layerPalette.near, true)}</svg>
          <svg width={900} height={180}>{generateLayer(59, layerPalette.near, true)}</svg>
          <svg width={900} height={180}>{generateLayer(61, layerPalette.near, true)}</svg>
        </div>
        <div className="background-city-sequence">
          <svg width={900} height={180}>{generateLayer(53, layerPalette.near, true)}</svg>
          <svg width={900} height={180}>{generateLayer(59, layerPalette.near, true)}</svg>
          <svg width={900} height={180}>{generateLayer(61, layerPalette.near, true)}</svg>
        </div>
      </div>
      {/* Crane layer (night visibility) */}
      <div className="background-cranes-layer">
        <svg width={900} height={200}>
          {/* Simple crane shapes */}
          <g className="crane" transform="translate(120,40)">
            <rect x={0} y={60} width={6} height={100} fill="#445" />
            <rect x={-40} y={60} width={120} height={6} fill="#556" />
            <rect x={50} y={66} width={30} height={20} fill="#667" />
            <line x1={-20} y1={66} x2={40} y2={120} stroke="#778" strokeWidth={4} />
            <rect x={38} y={80} width={10} height={30} fill="#889" className="crane-hook" />
          </g>
          <g className="crane" transform="translate(520,30)">
            <rect x={0} y={70} width={5} height={90} fill="#445" />
            <rect x={-50} y={70} width={140} height={5} fill="#556" />
            <rect x={40} y={75} width={25} height={18} fill="#667" />
            <line x1={-30} y1={75} x2={35} y2={125} stroke="#778" strokeWidth={3} />
            <rect x={30} y={85} width={9} height={26} fill="#889" className="crane-hook" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default AnimatedCityBackground;