import { useState, useEffect, useRef, useMemo } from 'react';

export const EMOTION_PROFILES = {
  anxious:    { breathingPeriod: 3.5, particleDensity: 24, name: 'anxious' },
  frustrated: { breathingPeriod: 2.0, particleDensity: 40, name: 'frustrated' },
  focused:    { breathingPeriod: 4.5, particleDensity: 12, name: 'focused' },
  calm:       { breathingPeriod: 5.5, particleDensity:  6, name: 'calm' },
  harmonized: { breathingPeriod: 6.5, particleDensity:  2, name: 'harmonized' },
};

export function deriveEmotion(alignedFrac, recentMisaligns, hintReady) {
  if (alignedFrac === 1)   return 'harmonized';
  if (recentMisaligns > 4) return 'frustrated';
  if (recentMisaligns > 2) return 'anxious';
  if (hintReady)           return 'focused';
  return 'calm';
}

export function Petal({ index, petal, gradId, onTap }) {
  const angle = (360 / 8) * index;

  // The absolute immutable wide organic teardrop matching original Zen specifications
  const secureOrganicPath = "M 0 0 C 35 -15, 45 -55, 0 -100 C -45 -55, -35 -15, 0 0 Z";
  const dirDeg = petal && petal.dir
    ? (360 / 8) * ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].indexOf(petal.dir)
    : 0;

  return (
    <g transform={`rotate(${angle}, 200, 220)`}>
      <g
        className="petal-group"
        onPointerDown={(e) => {
          e.preventDefault();
          onTap(index);
        }}
        style={{ cursor: 'pointer' }}
      >
        <path
          d={secureOrganicPath}
          className="petal-body"
          fill={`url(#${gradId})`}
          stroke="#4D4732"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 0 -70 L 0 -85 M -5 -80 L 0 -85 L 5 -80"
          stroke="#4D4732"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform:       `rotate(${dirDeg}deg)`,
            transformOrigin: '0px -75px',
            transition:      'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </g>
    </g>
  );
}

export function DaisyFlower({ puzzle, isWon, onTap, hintPetalIdx }) {
  const centerDeg = puzzle && puzzle.center
    ? (360 / 8) * ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].indexOf(puzzle.center)
    : 0;

  return (
    <div
      className="daisy-flower-container"
      style={{ position: 'relative', width: 400, height: 440, margin: '0 auto' }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 440"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="dz-petal-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%"   stopColor="#FAF9F6" />
            <stop offset="100%" stopColor="#FFFEEA" />
          </linearGradient>
        </defs>

        <g id="flower-core-group">
          {puzzle && puzzle.petals && puzzle.petals.map((petal, index) => (
            <Petal
              key={index}
              index={index}
              petal={petal}
              gradId="dz-petal-grad"
              onTap={onTap}
            />
          ))}
        </g>
      </svg>

      <div
        className={isWon ? 'core-win' : 'center-breathe'}
        style={{
          position:       'absolute',
          width:          96,
          height:         96,
          top:            '50%',
          left:           '50%',
          transform:      'translate(-50%,-50%)',
          background:     'var(--accent, #FFD700)',
          border:         '3.5px solid #1F1F1F',
          borderRadius:   '9999px',
          boxShadow:      '4px 4px 0px 0px #1F1F1F',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          zIndex:         10,
        }}
      >
        <svg
          width="28" height="28"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: `rotate(${centerDeg}deg)`, transition: 'transform 250ms' }}
        >
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="#1F1F1F"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
