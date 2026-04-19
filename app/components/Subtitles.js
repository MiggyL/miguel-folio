'use client';

import { useState, useEffect, useRef } from 'react';
import { ASSET_CONFIG } from '@/lib/assets';

function parseSRT(text) {
  const cues = [];
  const blocks = text.trim().split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;
    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!timeMatch) continue;
    const start =
      +timeMatch[1] * 3600 + +timeMatch[2] * 60 + +timeMatch[3] + +timeMatch[4] / 1000;
    const end =
      +timeMatch[5] * 3600 + +timeMatch[6] * 60 + +timeMatch[7] + +timeMatch[8] / 1000;
    const cueText = lines.slice(2).join(' ').trim();
    cues.push({ start, end, text: cueText });
  }
  return cues;
}

export default function Subtitles({ videoRef, language, section, onCueChange, srtUrl, silent }) {
  const [cues, setCues] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const animFrameRef = useRef(null);

  const srtMap = {
    'Intro': 'intro',
    'Objective': 'objective',
    'Skills': 'skills',
    'Certifications': 'certifications',
    'Applied Skills': 'applied',
    'Projects': 'projects',
  };

  useEffect(() => {
    if (!section && !srtUrl) {
      setCues([]);
      setCurrentText('');
      return;
    }
    const url = srtUrl
      ? srtUrl
      : (() => {
          const name = srtMap[section];
          return name ? `${ASSET_CONFIG.basePath}/${language}/${name}.srt` : null;
        })();
    if (!url) return;

    fetch(url)
      .then((r) => r.text())
      .then((srtText) => setCues(parseSRT(srtText)))
      .catch(() => setCues([]));
  }, [section, language, srtUrl]);

  useEffect(() => {
    if (!cues.length || !videoRef?.current) {
      setCurrentText('');
      return;
    }

    const update = () => {
      const t = videoRef.current?.currentTime ?? 0;
      const idx = cues.findIndex((c) => t >= c.start && t < c.end);
      setCurrentText(idx >= 0 ? cues[idx].text : '');
      onCueChange?.(idx, cues);
      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cues, videoRef]);

  if (silent || !currentText) return null;

  // Bottom-anchored, on top of every other banner layer (avatar, section video, backdrops).
  // z-50 > all sibling overlays so it stays visible while the avatar is speaking.
  return (
    <div
      className="absolute bottom-2 left-0 right-0 z-50 flex justify-center pointer-events-none px-2"
      // translate3d forces a compositing layer so mobile Safari stacks this above
      // the native <video> layer — without it, long/multi-line subtitles render
      // behind the avatar on iOS despite z-50.
      style={{ transform: 'translate3d(0,0,0)', WebkitTransform: 'translate3d(0,0,0)' }}
    >
      <p className="text-white text-xs sm:text-[10px] leading-snug text-center font-medium tracking-wide max-w-[85%] sm:max-w-[60%]"
         style={{
           textShadow:
             '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 6px rgba(0,0,0,0.9)',
         }}>
        {currentText}
      </p>
    </div>
  );
}
