'use client';

import { useState, useRef, useEffect } from 'react';
import { getVideoPath, getPosterPath, VIDEO_NAMES } from '@/lib/assets';

export default function Avatar({ isAltAvatar }) {
  const idleVideoRef = useRef(null);
  const [isIdleLoading, setIsIdleLoading] = useState(true);

  useEffect(() => {
    if (idleVideoRef.current) {
      idleVideoRef.current.src = getVideoPath(VIDEO_NAMES.idle, { isReal: isAltAvatar });
      idleVideoRef.current.load();
      if (idleVideoRef.current.readyState >= 3) {
        setIsIdleLoading(false);
      }
      idleVideoRef.current.play().catch(err => console.log('Initial idle play error:', err));
    }
  }, []);

  useEffect(() => {
    if (idleVideoRef.current) {
      const newSrc = getVideoPath(VIDEO_NAMES.idle, { isReal: isAltAvatar });
      if (idleVideoRef.current.src !== window.location.origin + newSrc) {
        idleVideoRef.current.src = newSrc;
        idleVideoRef.current.load();
        idleVideoRef.current.play().catch(err => console.log('Idle play error:', err));
      }
    }
  }, [isAltAvatar]);

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {/* Static Poster Image - Always visible as background */}
      <img
        src={getPosterPath(isAltAvatar)}
        alt="Avatar"
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Idle Loop Video */}
      <video
        ref={idleVideoRef}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        muted
        preload="metadata"
        playsInline
        onCanPlay={() => setIsIdleLoading(false)}
        onLoadedData={() => setIsIdleLoading(false)}
        onLoadStart={() => setIsIdleLoading(true)}
        onError={(e) => {
          console.error('Idle video error:', e);
          setIsIdleLoading(false);
        }}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{ pointerEvents: 'none' }}
      />

      {/* Loading Indicator */}
      {isIdleLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-white shadow-lg animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-white shadow-lg animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 rounded-full bg-white shadow-lg animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      )}
    </div>
  );
}
