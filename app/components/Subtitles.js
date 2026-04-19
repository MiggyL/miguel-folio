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

  // Positioned to fill the space left of the avatar, with equal padding on both sides.
  // Avatar is 35% height, bottom-right. Subtitles sit in the remaining left area,
  // vertically centered with the avatar, with matching right margin.
  return (
    <div className="absolute bottom-2 left-0 right-0 z-[6] flex justify-center pointer-events-none">
      <p className="text-white text-xs sm:text-[10px] leading-snug text-center font-medium tracking-wide max-w-[85%] sm:max-w-[60%]"
         style={{ textShadow: '0 0 4px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)' }}>
        {currentText}
      </p>
    </div>
  );
}
