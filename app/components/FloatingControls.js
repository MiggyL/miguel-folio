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
  const rootRef = useRef(null);

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

  return (
    <div ref={rootRef} className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
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

      {/* The FAB itself — gear that spins continuously */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
        aria-label={open ? 'Close controls' : 'Open controls'}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin [animation-duration:6s]"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
