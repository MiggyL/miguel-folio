'use client';

import { useState, useRef, useCallback } from 'react';
import { ASSET_CONFIG } from '@/lib/assets';
import IdleOverlay from './IdleOverlay';
import Subtitles from './Subtitles';

// Map section button labels to video filenames in EN/ and DE/
const SECTION_VIDEO_MAP = {
  'Intro': 'intro.mp4',
  'Objective': 'objective.mp4',
  'Skills': 'skills.mp4',
  'Certifications': 'certifications.mp4',
  'Applied Skills': 'applied.mp4',
  'Projects': 'projects.mp4',
};

const PROJECT_SEGMENTS = {
  'Interactive Resume': {
    segments: ['seg1_intro.mp4', 'seg2_skills.mp4', 'seg3_experience.mp4', 'seg4_certs.mp4', 'seg5_contact.mp4'],
    labels: ['Intro', 'Skills', 'Experience', 'Certifications', 'Contact'],
  },
  'DTR System': {
    segments: ['dtr_seg1.mp4', 'dtr_seg2.mp4', 'dtr_seg3.mp4', 'dtr_seg4.mp4', 'dtr_seg5.mp4'],
    labels: ['The System', 'The Team', 'Miguel Joins', 'Calendar View', 'The Impact'],
  },
};

export { PROJECT_SEGMENTS };

export default function Banner() {
  const videoRef = useRef(null);
  const sectionVideoRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(-1);
  const [activeProject, setActiveProject] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [language, setLanguage] = useState('EN');
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    setIsMuted(!isMuted);
  };

  const playSegments = useCallback(async (projectTitle) => {
    const config = PROJECT_SEGMENTS[projectTitle];
    if (!config || isPlaying) return;
    setIsPlaying(true);
    setActiveProject(projectTitle);

    const video = videoRef.current;
    if (!video) return;

    video.scrollIntoView({ behavior: 'smooth', block: 'center' });

    for (let i = 0; i < config.segments.length; i++) {
      setCurrentSegment(i);
      video.loop = false;
      video.src = `${ASSET_CONFIG.basePath}/${config.segments[i]}`;
      video.load();

      await new Promise((resolve) => {
        video.oncanplay = () => {
          video.play().catch(() => {});
        };
        video.onended = resolve;
        video.onerror = resolve;
      });
    }

    setCurrentSegment(-1);
    setIsPlaying(false);
    setActiveProject(null);
    video.loop = true;
    video.src = `${ASSET_CONFIG.basePath}/bg.mp4`;
    video.load();
    video.play().catch(() => {});
  }, [isPlaying]);

  const handleSectionClick = (section) => {
    const filename = SECTION_VIDEO_MAP[section];
    if (!filename) return;

    const sectionVideo = sectionVideoRef.current;
    if (!sectionVideo) return;

    setOverlayVisible(false);
    setActiveSection(section);

    // Load and play section video
    let started = false;
    sectionVideo.src = `${ASSET_CONFIG.basePath}/${language}/${filename}`;
    sectionVideo.load();
    sectionVideo.oncanplay = () => {
      if (started) return;
      started = true;
      setSectionVisible(true);
      sectionVideo.play().catch(() => {});
    };
    sectionVideo.onended = () => {
      setSectionVisible(false);
      setActiveSection(null);
      setOverlayVisible(true);
    };
    sectionVideo.onerror = () => {
      setSectionVisible(false);
      setActiveSection(null);
      setOverlayVisible(true);
    };
  };

  return (
    <div className="relative bg-black rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <audio ref={audioRef} loop src={`${ASSET_CONFIG.basePath}/ambient.mp3`} />
      <div className="w-full" style={{ aspectRatio: '1173/640' }}>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src={`${ASSET_CONFIG.basePath}/bg.mp4`}
        />
      </div>

      {/* Idle avatar overlay — bottom-right, always playing */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute bottom-0 right-0 object-cover rounded-br-2xl"
        style={{ height: '35%', aspectRatio: '1/1', zIndex: 1 }}
        src={`${ASSET_CONFIG.basePath}/idle.mp4`}
      />

      {/* Section video overlay — plays on top of idle avatar */}
      <video
        ref={sectionVideoRef}
        playsInline
        className="absolute bottom-0 right-0 object-cover rounded-br-2xl transition-opacity duration-300"
        style={{
          height: '35%',
          aspectRatio: '1/1',
          zIndex: 3,
          opacity: sectionVisible ? 1 : 0,
          pointerEvents: sectionVisible ? 'auto' : 'none',
        }}
      />


      {/* Subtitles — displayed beside the avatar during section playback */}
      <Subtitles videoRef={sectionVideoRef} language={language} section={activeSection} />

      {/* Top-left: EN|DE toggle + Play intro */}
      <div className="absolute top-3 left-3 z-[6] flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-md opacity-50 hover:opacity-100 transition-all">
          <button onClick={() => setLanguage('EN')} className={`text-[11px] sm:text-xs font-medium tracking-wide cursor-pointer transition-colors ${language === 'EN' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
            EN
          </button>
          <span className="text-white/30 text-[11px]">|</span>
          <button onClick={() => setLanguage('DE')} className={`text-[11px] sm:text-xs font-medium tracking-wide cursor-pointer transition-colors ${language === 'DE' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
            DE
          </button>
        </div>
        <button onClick={() => handleSectionClick('Intro')} className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" aria-label="Play intro">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        </button>
      </div>

      {/* Idle overlay: name, title, section buttons */}
      <IdleOverlay visible={overlayVisible} onSectionClick={handleSectionClick} />

      {/* Bottom-left: Resume button */}
      <a href="https://drive.google.com/file/d/1RyQRN930zeyjLZe2o_J52zWEB1kWyWQF" target="_blank" rel="noopener noreferrer" className="absolute bottom-3 left-3 z-[6] px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-md text-white/70 text-[11px] sm:text-xs font-medium tracking-wide hover:text-white hover:bg-white/20 transition-all cursor-pointer opacity-50 hover:opacity-100 no-underline">
        CV
      </a>

      {/* Audio toggle button */}
      <button
        onClick={toggleAudio}
        className="absolute top-3 right-3 z-10 opacity-50 hover:opacity-80 transition-opacity cursor-pointer"
        aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* Segment indicator overlay */}
      {isPlaying && currentSegment >= 0 && activeProject && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            {PROJECT_SEGMENTS[activeProject].labels.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSegment
                      ? 'w-8 bg-blue-400'
                      : i < currentSegment
                      ? 'w-4 bg-blue-400/50'
                      : 'w-4 bg-white/30'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    i === currentSegment ? 'text-blue-300' : 'text-white/40'
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
