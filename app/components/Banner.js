'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ASSET_CONFIG } from '@/lib/assets';
import IdleOverlay from './IdleOverlay';
import Subtitles from './Subtitles';

// Maps section → cue index → image filename(s) shown during that cue
const SECTION_IMAGES = {
  'Objective': [
    ['objective-1-1.png'],                                                                    // cue 1: programming / DevOps
    ['objective-2-1.png', 'objective-2-2.png', 'objective-2-3.png', 'objective-2-4.png'],    // cue 2: Power Platform, Python, JavaScript, Cloud
    ['objective-3-1.png', 'objective-3-2.png'],                                              // cue 3: Azure & OCI
  ],
  'Skills': [
    ['skills-1-1.png', 'skills-1-2.png', 'skills-1-3.png', 'skills-1-4.png'],               // cue 1: Power Platform, Automate, Apps, Dataverse
    ['skills-2-1.png', 'skills-2-2.png', 'skills-2-3.png'],                                 // cue 2: Python, JavaScript, AI
    ['skills-3-1.png', 'skills-3-2.png'],                                                    // cue 3: Azure & OCI
  ],
  'Applied Skills': [
    ['applied-skills-1-1.png'],                                                              // cue 1: ms-applied-power-automate
    ['applied-skills-2-1.png', 'applied-skills-2-2.png'],                                   // cue 2: ms-applied-power-apps-canvas, dataverse
  ],
  'Projects': [
    ['projects-1-1.png'],                                                                    // cue 1: PPE CCTV
    ['projects-2-1.png'],                                                                    // cue 2: ALOPA Chrome Extension
    ['projects-3-1.png'],                                                                    // cue 3: Food Price Forecasting
    ['projects-4-1.png'],                                                                    // cue 4: Local LLM (Mistral 7B)
    ['projects-5-1.png'],                                                                    // cue 5: YouTube Q&A
  ],
  'Certifications': [
    ['certifications-02-1.png', 'certifications-02-2.png'],                                  // cue 01: general intro — MS & Oracle logos
    ['certifications-02-1.png', 'certifications-02-2.png'],                                  // cue 02: Microsoft & Oracle logos
    ['certifications-03-1.png', 'certifications-03-2.png'],                                  // cue 03: ms-azure-ai-fundamentals, ai-engineer
    ['certifications-04-1.png', 'certifications-04-2.png'],                                  // cue 04: ms-azure-administrator, power-platform
    ['certifications-05-1.png'],                                                             // cue 05: oci-logo
    ['certifications-06-1.png', 'certifications-06-2.png'],                                  // cue 06: oci-architect-associate, multicloud
    ['certifications-07-1.png', 'certifications-07-2.png', 'certifications-07-3.png'],       // cue 07: oci-genai, ai-foundations, foundations
    ['certifications-08-1.png', 'certifications-08-2.png'],                                  // cue 08: oci-data-management, specialty
    ['certifications-09-1.png', 'certifications-09-2.png'],                                  // cue 09: pcep-python, jse-javascript
    ['certifications-10-1.png'],                                                             // cue 10: neo4j-certified-professional
    ['certifications-11-1.png', 'certifications-11-2.png'],                                  // cue 11: neo4j-graph-data-science, certified-professional
  ],
};

// Sections that cycle images one at a time (with interval in ms)
const SINGLE_IMAGE_SECTIONS = new Set(['Certifications', 'Applied Skills']);
const CYCLE_INTERVAL = 2000;

// Cue indices (0-based) that show logos side-by-side instead of cycling
const LOGO_CUES = {
  'Certifications': new Set([0, 1]), // cues 1 & 2 are MS/Oracle logos, not certificates
};

// Maps Intro cue index → section button to highlight (per language, since cue counts differ)
const INTRO_HIGHLIGHTS = {
  EN: { 2: 'Objective', 3: 'Skills', 4: 'Certifications', 5: 'Applied Skills', 6: 'Projects' },
  DE: { 3: 'Objective', 4: 'Skills', 5: 'Certifications', 6: 'Applied Skills', 7: 'Projects' },
};

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
  const [currentImages, setCurrentImages] = useState([]);
  const [highlightedSection, setHighlightedSection] = useState(null);
  const cuesRef = useRef([]);
  const [cycleImages, setCycleImages] = useState([]);  // full image list for cycling sections

  // Cycle through images one at a time for Certifications / Applied Skills
  useEffect(() => {
    if (cycleImages.length <= 1) return;
    setCurrentImages([cycleImages[0]]);
    let idx = 0;
    const id = setInterval(() => {
      idx = idx + 1;
      if (idx >= cycleImages.length) { clearInterval(id); return; }
      setCurrentImages([cycleImages[idx]]);
    }, CYCLE_INTERVAL);
    return () => clearInterval(id);
  }, [cycleImages]);

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
      setCurrentImages([]);
      setCycleImages([]);
      setHighlightedSection(null);
      setOverlayVisible(true);
    };
    sectionVideo.onerror = () => {
      setSectionVisible(false);
      setActiveSection(null);
      setCurrentImages([]);
      setCycleImages([]);
      setHighlightedSection(null);
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
        style={{ height: '35%', aspectRatio: '1/1', zIndex: 5 }}
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
          zIndex: 7,
          opacity: sectionVisible ? 1 : 0,
          pointerEvents: sectionVisible ? 'auto' : 'none',
        }}
      />


      {/* Subtitles — displayed beside the avatar during section playback */}
      <Subtitles
        videoRef={sectionVideoRef}
        language={language}
        section={activeSection}
        onCueChange={(idx, cues) => {
          cuesRef.current = cues || [];

          // Intro: highlight buttons instead of showing images
          if (activeSection === 'Intro') {
            const highlights = INTRO_HIGHLIGHTS[language] || {};
            setHighlightedSection(highlights[idx] || null);
            return;
          }

          const images = SECTION_IMAGES[activeSection]?.[idx];
          if (!images || images.length === 0) {
            setCurrentImages([]);
            setCycleImages([]);
            return;
          }

          const isLogoCue = LOGO_CUES[activeSection]?.has(idx);
          if (!isLogoCue && SINGLE_IMAGE_SECTIONS.has(activeSection) && images.length > 1) {
            // Cycle one at a time — store full list, effect handles the rest
            setCycleImages(images);
          } else {
            setCycleImages([]);
            setCurrentImages(images);
          }
        }}
      />

      {/* Slideshow images — synced to SRT cues; 2x2 grid for 3-4 items, row for 1-2 */}
      {currentImages.length > 0 && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none" style={{ paddingBottom: currentImages.length >= 3 ? '12%' : '0' }}>
          {currentImages.length >= 3 ? (
            <div className="grid grid-cols-2 gap-3 items-center justify-items-center" style={{ width: '65%', maxHeight: '70%' }}>
              {currentImages.map((img) => (
                <img
                  key={img}
                  src={`${ASSET_CONFIG.basePath}/images/${img}`}
                  alt=""
                  className="rounded-md shadow-lg object-contain"
                  style={{ maxWidth: '100%', maxHeight: '32vh' }}
                />
              ))}
              {/* Empty cell to fill 2x2 when only 3 items */}
              {currentImages.length === 3 && <div />}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3" style={{ width: '65%', maxHeight: '80%' }}>
              {currentImages.map((img) => (
                <img
                  key={img}
                  src={`${ASSET_CONFIG.basePath}/images/${img}`}
                  alt=""
                  className="rounded-md shadow-lg object-contain"
                  style={{
                    maxWidth: currentImages.length === 1 ? '100%' : `${Math.floor(90 / currentImages.length)}%`,
                    maxHeight: '80%',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Intro highlight overlay — non-interactive replica of IdleOverlay with glow on mentioned buttons */}
      {activeSection === 'Intro' && (
        <div className="absolute inset-0 flex items-center justify-center z-[6] pointer-events-none">
          <div className="text-center -mt-4 flex flex-col items-center">
            <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-lg">
              Miguel Lacanienta
            </h1>
            <p className="text-white/80 text-sm sm:text-base font-light mt-1.5 tracking-wide drop-shadow-md">
              BS Computer Science · AI Specialization · Mapúa University &apos;25
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              {['Objective', 'Skills', 'Certifications', 'Applied Skills', 'Projects'].map((section) => (
                <span
                  key={section}
                  className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium tracking-wide transition-all duration-300 border ${
                    highlightedSection === section
                      ? 'text-white bg-white/25 border-white/60 shadow-[0_0_14px_rgba(255,255,255,0.5)] scale-110'
                      : 'text-white/70 bg-white/10 border-white/15'
                  }`}
                >
                  {section}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
