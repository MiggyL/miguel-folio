'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Floating circle control center — bottom-right of viewport.
 * Consolidates the banner's scattered controls (EN/DE language toggle,
 * Play About, Mute background music, CV link) into one expandable panel,
 * inspired by Next.js dev's indicator.
 */
export default function FloatingControls({
  language,
  onLanguageChange,
  isMuted,
  onToggleMute,
  onPlayAbout,
  onPlayGame,
  cvHref,
}) {
  const [open, setOpen] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(false);
  const rootRef = useRef(null);
  const fabRef = useRef(null);
  const needleRef = useRef(null);

  // Detect whether the device has true hover (desktop with mouse). Touch
  // devices keep the existing click-to-toggle behavior.
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setHoverCapable(mq.matches);
    const onChange = (e) => setHoverCapable(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Close on click-outside or Escape
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Compass needle tracks the cursor
  useEffect(() => {
    let raf = 0;
    let pending = null;
    const apply = () => {
      raf = 0;
      const fab = fabRef.current;
      const needle = needleRef.current;
      if (!fab || !needle || !pending) return;
      const r = fab.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const angle = Math.atan2(pending.x - cx, -(pending.y - cy)) * (180 / Math.PI);
      needle.style.transform = `rotate(${angle}deg)`;
    };
    const onMove = (e) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2"
      onMouseEnter={hoverCapable ? () => setOpen(true) : undefined}
      onMouseLeave={hoverCapable ? () => setOpen(false) : undefined}
    >
      {/* Single frosted-dark panel with rows inside — Next.js dev style */}
      <div
        className={`bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[11rem] transition-all duration-200 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Play About — YouTube-red play button */}
        <button
          onClick={() => {
            setOpen(false);
            onPlayAbout?.();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="0" y="3.5" width="24" height="17" rx="4" fill="#FF0000" />
            <polygon points="10,8 10,16 16,12" fill="white" />
          </svg>
          <span>Play About</span>
        </button>

        {/* Language toggle — current flag as icon, EN/DE pills next to it */}
        <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 border-t border-white/10">
          <span className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/20 inline-block shrink-0">
            {language === 'DE' ? <FlagDE /> : <FlagUK />}
          </span>
          <span className="flex items-center bg-white/5 rounded-md p-0.5">
            <button
              onClick={() => onLanguageChange?.('EN')}
              className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                language === 'EN' ? 'bg-white text-gray-900' : 'text-white/60 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange?.('DE')}
              className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                language === 'DE' ? 'bg-white text-gray-900' : 'text-white/60 hover:text-white'
              }`}
            >
              DE
            </button>
          </span>
        </div>

        {/* Mute — colored music note (Spotify-style green when on, slashed when off) */}
        <button
          onClick={onToggleMute}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-t border-white/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18V5l12-2v13" fill="none" stroke={isMuted ? '#9ca3af' : '#1DB954'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" fill={isMuted ? '#9ca3af' : '#1DB954'} />
            <circle cx="18" cy="16" r="3" fill={isMuted ? '#9ca3af' : '#1DB954'} />
            {isMuted && <line x1="3" y1="3" x2="21" y2="21" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />}
          </svg>
          <span>{isMuted ? 'Unmute music' : 'Mute music'}</span>
        </button>

        {/* CV — Adobe Acrobat red PDF icon */}
        <a
          href={cvHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer no-underline border-t border-white/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            {/* Page silhouette */}
            <path d="M5 2h10l5 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#F2F2F2" />
            <path d="M15 2v5h5" fill="#D9D9D9" />
            {/* Red Adobe PDF badge */}
            <rect x="2" y="11" width="16" height="8" rx="1.5" fill="#E2231A" />
            <text x="10" y="17.4" textAnchor="middle" fill="white" fontSize="5.2" fontWeight="700" fontFamily="Arial, sans-serif">PDF</text>
          </svg>
          <span>CV</span>
        </a>

        {/* Play Game — Chrome dino, last in the menu */}
        <button
          onClick={() => {
            setOpen(false);
            onPlayGame?.();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-t border-white/10"
        >
          <span className="text-base leading-none">🎮</span>
          <span>Play Game</span>
        </button>
      </div>

      {/* The FAB itself — refined real compass; needle tracks the cursor */}
      <button
        ref={fabRef}
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl cursor-pointer transition-shadow overflow-hidden p-0 bg-transparent"
        aria-label={open ? 'Close controls' : 'Open controls'}
      >
        <svg viewBox="2 2 96 96" width="100%" height="100%" aria-hidden="true">
          <defs>
            <radialGradient id="fc-case" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
            <linearGradient id="fc-bezel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e7d28b" />
              <stop offset="50%" stopColor="#b48b3a" />
              <stop offset="100%" stopColor="#7d5f24" />
            </linearGradient>
            <radialGradient id="fc-face" cx="40%" cy="35%" r="80%">
              <stop offset="0%" stopColor="#fdf8e8" />
              <stop offset="70%" stopColor="#f3e8c4" />
              <stop offset="100%" stopColor="#e8d8a3" />
            </radialGradient>
            <radialGradient id="fc-glass" cx="35%" cy="20%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="48" fill="url(#fc-case)" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#fc-bezel)" strokeWidth="2.4" />
          <circle cx="50" cy="50" r="42.5" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />

          <g stroke="#e7d28b" strokeLinecap="round">
            <line x1="50" y1="6" x2="50" y2="11" strokeWidth="1.4" />
            <line x1="50" y1="89" x2="50" y2="94" strokeWidth="1.4" />
            <line x1="6" y1="50" x2="11" y2="50" strokeWidth="1.4" />
            <line x1="89" y1="50" x2="94" y2="50" strokeWidth="1.4" />
            <g strokeWidth="0.8" opacity="0.6">
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(30 50 50)" />
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(60 50 50)" />
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(120 50 50)" />
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(150 50 50)" />
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(210 50 50)" />
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(240 50 50)" />
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(300 50 50)" />
              <line x1="50" y1="7" x2="50" y2="9" transform="rotate(330 50 50)" />
            </g>
          </g>

          <circle cx="50" cy="50" r="36" fill="url(#fc-face)" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />

          <g fill="rgba(45,32,8,0.18)">
            <polygon points="50,18 47.5,50 52.5,50" />
            <polygon points="50,82 47.5,50 52.5,50" />
            <polygon points="82,50 50,47.5 50,52.5" />
            <polygon points="18,50 50,47.5 50,52.5" />
          </g>
          <g fill="rgba(45,32,8,0.10)">
            <polygon points="50,50 73,27 75,29 52,52" />
            <polygon points="50,50 73,73 71,75 48,52" />
            <polygon points="50,50 27,73 25,71 48,48" />
            <polygon points="50,50 27,27 29,25 52,48" />
          </g>

          <g fontFamily="'Georgia', 'Times New Roman', serif" fontWeight="700" textAnchor="middle">
            <text x="50" y="29" fill="#b91c1c" fontSize="9">N</text>
            <text x="71" y="53" fill="#3d2c10" fontSize="7.5">E</text>
            <text x="50" y="77" fill="#3d2c10" fontSize="7.5">S</text>
            <text x="29" y="53" fill="#3d2c10" fontSize="7.5">W</text>
          </g>

          <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(45,32,8,0.18)" strokeWidth="0.6" />

          <g
            ref={needleRef}
            style={{
              transformOrigin: '50% 50%',
              transformBox: 'fill-box',
              transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <polygon points="50,16 46.5,50 53.5,50" fill="#b91c1c" />
            <polygon points="50,16 50,50 53.5,50" fill="#7f1d1d" />
            <polygon points="50,84 46.5,50 53.5,50" fill="#334155" />
            <polygon points="50,84 50,50 53.5,50" fill="#1e293b" />
            <circle cx="50" cy="50" r="3" fill="url(#fc-bezel)" stroke="#3d2c10" strokeWidth="0.6" />
            <circle cx="50" cy="50" r="1" fill="#3d2c10" />
          </g>

          <circle cx="50" cy="50" r="36" fill="url(#fc-glass)" pointerEvents="none" />
        </svg>
      </button>
    </div>
  );
}

function FlagUK() {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" className="w-full h-full block" aria-hidden="true">
      <clipPath id="uk-clip"><rect width="60" height="30" /></clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="white" strokeWidth="6" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" strokeWidth="3" clipPath="url(#uk-clip)" />
        <path d="M30,0 v30 M0,15 h60" stroke="white" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagDE() {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" className="w-full h-full block" aria-hidden="true">
      <rect y="0" width="60" height="10" fill="#000000" />
      <rect y="10" width="60" height="10" fill="#DD0000" />
      <rect y="20" width="60" height="10" fill="#FFCE00" />
    </svg>
  );
}
