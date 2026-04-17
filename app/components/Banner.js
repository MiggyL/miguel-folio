'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ASSET_CONFIG } from '@/lib/assets';
import IdleOverlay from './IdleOverlay';
import Subtitles from './Subtitles';

// Maps section → cue index → image filename(s) shown during that cue
const SECTION_IMAGES = {
  'Objective': [
    ['objective-1-1.webp'],                                                                    // cue 1: programming / DevOps
    ['objective-2-1.webp', 'objective-2-2.webp', 'objective-2-3.webp', 'objective-2-4.webp'],    // cue 2: Power Platform, Python, JavaScript, Cloud
    ['objective-3-1.webp', 'objective-3-2.webp'],                                              // cue 3: Azure & OCI
  ],
  'Skills': [
    ['skills-1-1.webp', 'skills-1-2.webp', 'skills-1-3.webp', 'skills-1-4.webp'],               // cue 1: Power Platform, Automate, Apps, Dataverse
    ['skills-2-1.webp', 'skills-2-2.webp', 'skills-2-3.webp'],                                 // cue 2: Python, JavaScript, AI
    ['skills-3-1.webp', 'skills-3-2.webp'],                                                    // cue 3: Azure & OCI
  ],
  'Applied Skills': [
    ['applied-skills-1-1.webp'],                                                              // cue 1: ms-applied-power-automate
    ['applied-skills-2-1.webp', 'applied-skills-2-2.webp'],                                   // cue 2: ms-applied-power-apps-canvas, dataverse
  ],
  'Projects': [
    ['projects-1-1.webp'],                                                                    // cue 1: PPE CCTV
    ['projects-2-1.webp'],                                                                    // cue 2: ALOPA Chrome Extension
    ['projects-3-1.webp'],                                                                    // cue 3: Food Price Forecasting
    ['projects-4-1.webp'],                                                                    // cue 4: Local LLM (Mistral 7B)
    ['projects-5-1.webp'],                                                                    // cue 5: YouTube Q&A
  ],
  'Certifications': [
    ['certifications-02-1.webp', 'certifications-02-2.webp'],                                  // cue 01: general intro — MS & Oracle logos
    ['certifications-02-1.webp', 'certifications-02-2.webp'],                                  // cue 02: Microsoft & Oracle logos
    ['certifications-03-1.webp', 'certifications-03-2.webp'],                                  // cue 03: ms-azure-ai-fundamentals, ai-engineer
    ['certifications-04-1.webp', 'certifications-04-2.webp'],                                  // cue 04: ms-azure-administrator, power-platform
    ['certifications-05-1.webp'],                                                             // cue 05: oci-logo
    ['certifications-06-1.webp', 'certifications-06-2.webp'],                                  // cue 06: oci-architect-associate, multicloud
    ['certifications-07-1.webp', 'certifications-07-2.webp', 'certifications-07-3.webp'],       // cue 07: oci-genai, ai-foundations, foundations
    ['certifications-08-1.webp', 'certifications-08-2.webp'],                                  // cue 08: oci-data-management, specialty
    ['certifications-09-1.webp', 'certifications-09-2.webp'],                                  // cue 09: pcep-python, jse-javascript
    ['certifications-10-1.webp'],                                                             // cue 10: neo4j-certified-professional
    ['certifications-11-1.webp', 'certifications-11-2.webp'],                                  // cue 11: neo4j-graph-data-science, certified-professional
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
  'DTR System': {
    segments: ['dtr_seg1.mp4', 'dtr_seg2.mp4', 'dtr_seg3.mp4', 'dtr_seg4.mp4', 'dtr_seg5.mp4'],
    labels: ['The System', 'The Team', 'Miguel Joins', 'Calendar View', 'The Impact'],
  },
};

// Genie Game config — state machine driven video experience
const GENIE_CONFIG = {
  basePath: 'genie',
  enter: 'enter.mp4',
  greet: 'greet.mp4',
  idle: 'idle.mp4',
  avatar: { EN: 'genie/en.mp4', DE: 'genie/de.mp4' },
  srt: { EN: 'genie/en.srt', DE: 'genie/de.srt' },
  actions: [
    { label: 'Wish', video: 'wish.mp4' },
    { label: 'Lose 1', video: 'lose1.mp4' },
    { label: 'Lose 2', video: 'lose2.mp4' },
    { label: 'Win 1', video: 'win1.mp4' },
    { label: 'Win 2', video: 'win2.mp4' },
    { label: 'Warn 2', video: 'warn2.mp4' },
  ],
};

// Hackathon Videos config — simple video picker (no idle/enter sequence)
const HACKATHON_CONFIG = {
  basePath: 'hackathon',
  avatar: { EN: 'hackathon/en.mp4', DE: 'hackathon/de.mp4' },
  srt: { EN: 'hackathon/en.srt', DE: 'hackathon/de.srt' },
  videos: [
    { label: 'RecruitBolt', video: 'recruit-bolt.mp4', thumb: 'recruit-bolt.webp' },
    { label: 'SpecSync', video: 'specsync.mp4', thumb: 'specsync.webp' },
    { label: 'r/factchecker', video: 'r-factchecker.mp4', thumb: 'r-factchecker.webp' },
  ],
};

// Project showcase — lightweight overlay with hero image + credibility bullets
const PROJECT_SHOWCASE = {
  'DTR System': {
    avatar: { EN: 'dtr/en.mp4', DE: 'dtr/de.mp4' },
    srt: { EN: 'dtr/en.srt', DE: 'dtr/de.srt' },
    images: ['dtr/1.webp', 'dtr/2.webp', 'dtr/3.webp'],
    subtitles: [
      'A DTR system maintained by 5 people. I built a solo POC to prove AI can cut that cost.',
      'Full-stack solo build — Express REST API, MongoDB, AngularJS. One dev. No docs. No onboarding.',
      'The POC proved it. AI-assisted development can dramatically reduce labor cost.',
    ],
    bullets: [
      'Solo-built full-stack POC: Node.js + Express REST API, MongoDB persistence, AngularJS SPA',
      'Implemented calendar-view attendance with date-range queries and aggregation pipelines',
      'Delivered without documentation or onboarding — reverse-engineered legacy requirements',
    ],
  },
  'PPE Detection (Thesis)': {
    avatar: { EN: 'ppe/en.mp4', DE: 'ppe/de.mp4' },
    srt: { EN: 'ppe/en.srt', DE: 'ppe/de.srt' },
    media: ['ppe/1.mp4', 'ppe/2.webp', 'ppe/3.webp'],
    subtitles: [
      'Construction sites are dangerous. I built an AI that watches.',
      'I fine-tuned YOLOv9 on a custom dataset — 92%+ mAP on hardhat, vest, and goggle detection.',
      'Violations trigger instant Telegram alerts to site managers. Real-time.',
    ],
    bullets: [
      'Fine-tuned YOLOv9 on custom PPE dataset (hardhat, vest, goggles) achieving 92%+ mAP',
      'Real-time CCTV inference pipeline with Telegram alerts to site managers on violations',
      'Thesis defense: presented model architecture, training curves, and inference benchmarks',
    ],
  },
  'Sheets-to-Form Automation': {
    avatar: { EN: 'sheets-to-form/en.mp4', DE: 'sheets-to-form/de.mp4' },
    srt: { EN: 'sheets-to-form/en.srt', DE: 'sheets-to-form/de.srt' },
    images: ['sheets-to-form/1.webp', 'sheets-to-form/2.webp', 'sheets-to-form/3.webp'],
    subtitles: [
      'Hundreds of rows. One web form. Hours of copy-paste. I said no.',
      'Chrome extension + Flask + Selenium — reads the sheet, fills the forms, handles errors.',
      'From manual copy-paste to automatic form fill-up. One click, entire form filled.',
    ],
    bullets: [
      'Chrome extension + Flask backend automating bulk digital asset uploads from Google Sheets',
      'Selenium WebDriver for headless form submission with error recovery and retry logic',
      'Eliminated hours of manual data entry for stock photos, greeting cards, and digital assets',
    ],
  },
  'Food Price Forecasting': {
    avatar: { EN: 'price-forecasting/en.mp4', DE: 'price-forecasting/de.mp4' },
    srt: { EN: 'price-forecasting/en.srt', DE: 'price-forecasting/de.srt' },
    images: ['price-forecasting/1.webp', 'price-forecasting/2.webp', 'price-forecasting/3.webp'],
    subtitles: [
      'Food prices in the Philippines are unpredictable. Using WFP data, I built a model to forecast them.',
      'ARIMA time-series model built in Orange Data Mining — import, filter, transform, forecast, evaluate.',
      'Forecasts for maize, rice, beans, fish, and sugar — evaluated with RMSE, MAE, MAPE, and R².',
    ],
    bullets: [
      'ARIMA time-series forecasting using World Food Programme price data (2019+)',
      'Orange Data Mining pipeline: data filtering, time-series transformation, ARIMA with confidence intervals',
      'Evaluated with RMSE, MAE, MAPE, R² and cross-validation across Philippine regional markets',
    ],
  },
  'Local LLM App': {
    avatar: { EN: 'local-llm/en.mp4', DE: 'local-llm/de.mp4' },
    srt: { EN: 'local-llm/en.srt', DE: 'local-llm/de.srt' },
    images: ['local-llm/1.webp', 'local-llm/2.webp', 'local-llm/3.webp'],
    subtitles: [
      'No API keys. No cloud. I run a 7B parameter LLM on a single GPU.',
      'LangChain orchestration + RAG pipeline + quantized Mistral-7B inference.',
      'A fully local AI assistant. Private, fast, and surprisingly capable.',
    ],
    bullets: [
      'LangChain orchestration with Mistral-7B running fully local — no API dependency',
      'Hugging Face Transformers quantized inference on consumer GPU',
      'Prompt engineering with retrieval-augmented generation (RAG) pipeline',
    ],
  },
  'YouTube Q&A Tool': {
    avatar: { EN: 'youtube/en.mp4', DE: 'youtube/de.mp4' },
    srt: { EN: 'youtube/en.srt', DE: 'youtube/de.srt' },
    media: ['youtube/1.mp4', 'youtube/2.webp', 'youtube/3.mp4'],
    subtitles: [
      'A 2-hour YouTube video. You have one question. I built a Google Colab notebook for that.',
      'LangChain extracts transcripts, chunks text, embeds vectors into FAISS, and retrieves answers.',
      'Full RAG pipeline in a notebook — from raw video to precise, sourced answers powered by Mistral-7B.',
    ],
    bullets: [
      'Google Colab notebook: paste a YouTube URL, ask any question about the video',
      'RAG pipeline: transcript extraction, text chunking, FAISS vector search, Mistral-7B inference',
      'Built with LangChain, HuggingFace Embeddings, and 4-bit quantized local LLM',
    ],
  },
  'RPSLS Game': {
    avatar: { EN: 'rpsls/en.mp4', DE: 'rpsls/de.mp4' },
    srt: { EN: 'rpsls/en.srt', DE: 'rpsls/de.srt' },
    images: ['rpsls/1.webp', 'rpsls/2.webp', 'rpsls/3.webp'],
    subtitles: [
      'Rock Paper Scissors Lizard Spock — I built this for Digital Data Day in Manila.',
      'Street Fighter-style UI with face avatars and hand moves. Deployed as RonnieAI on Microsoft Bot Framework.',
      'Hundreds of players in a packed room. Knockout rounds on their phones. One champion. It was wild.',
    ],
    bullets: [
      'Rock Paper Scissors Lizard Spock built on Microsoft Bot Framework (Adaptive Cards)',
      'Deployed as RonnieAI — hundreds of players in a knockout tournament at Digital Data Day Manila',
      'Packed room, mobile-based play, bracket elimination rounds until one champion remains',
    ],
  },
  'HTTYD Telegram Bots': {
    avatar: { EN: 'httyd/en.mp4', DE: 'httyd/de.mp4' },
    srt: { EN: 'httyd/en.srt', DE: 'httyd/de.srt' },
    images: ['httyd/1.webp', 'httyd/2.webp', 'httyd/3.webp'],
    subtitles: [
      'What if you could chat with dragons? I built the Telegram bots for that.',
      'Players prompt the AI dragons through n8n workflows. Each dragon thinks and reacts differently.',
      'Played at Cambridge University Press & Assessment\'s Digital Data Day — both Manila and UK.',
    ],
    bullets: [
      'Multiple Telegram bots with distinct dragon character personalities',
      'n8n workflow automation with player-driven AI dragon prompts',
      'Played at Digital Data Day — Cambridge University Press & Assessment Manila and UK',
    ],
  },
};

export { PROJECT_SEGMENTS, GENIE_CONFIG, HACKATHON_CONFIG, PROJECT_SHOWCASE };

const Banner = forwardRef(function Banner(props, ref) {
  const videoRef = useRef(null);
  const sectionVideoRef = useRef(null);
  const genieIdleRef = useRef(null);   // always-looping idle layer (muted, underneath)
  const genieActionRef = useRef(null); // action/sequence layer (on top, shown during non-idle)
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
  const sectionActiveRef = useRef(false);
  const exitOverlayRef = useRef(null);
  const [cycleImages, setCycleImages] = useState([]);  // full image list for cycling sections

  // Genie Game state: null | 'entering' | 'idle' | 'action'
  const [genieState, setGenieState] = useState(null);
  const [genieButtonsEnabled, setGenieButtonsEnabled] = useState(false);

  // Hackathon Videos state: null | 'picking' | 'playing'
  const hackathonVideoRef = useRef(null);
  const [hackathonState, setHackathonState] = useState(null);

  // Project showcase state
  const [showcaseProject, setShowcaseProject] = useState(null);
  const [showcaseImageIdx, setShowcaseImageIdx] = useState(0);
  const [showcaseSubtitle, setShowcaseSubtitle] = useState('');
  const showcaseCuesRef = useRef([]);
  const showcaseSyncRef = useRef(null);

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

  // Cycle showcase media (images cycle on 3s timer; videos advance on ended)
  const showcaseVideoRef = useRef(null);
  const showcaseTimerRef = useRef(null);

  // Get the media list for the current showcase project
  const showcaseMedia = showcaseProject
    ? PROJECT_SHOWCASE[showcaseProject]?.media || PROJECT_SHOWCASE[showcaseProject]?.images
    : null;

  const advanceShowcase = useCallback(() => {
    if (!showcaseMedia || showcaseMedia.length <= 1) return;
    setShowcaseImageIdx((prev) => (prev + 1) % showcaseMedia.length);
  }, [showcaseMedia]);

  // Play showcase avatar video (e.g. DTR) in the bottom-right avatar slot
  useEffect(() => {
    if (!showcaseProject) return;
    const avatarMap = PROJECT_SHOWCASE[showcaseProject]?.avatar;
    if (!avatarMap) return;
    const avatarSrc = avatarMap[language] || avatarMap.EN || avatarMap.DE;
    if (!avatarSrc) return;

    const sv = sectionVideoRef.current;
    if (!sv) return;

    sectionActiveRef.current = true;
    sv.src = `${ASSET_CONFIG.basePath}/${avatarSrc}`;
    sv.loop = false;
    sv.muted = false;
    sv.load();
    let started = false;
    sv.oncanplay = () => {
      if (!started) {
        started = true;
        setSectionVisible(true);
        sv.play().catch(() => {});
      }
    };
    // When avatar finishes, close overlay and return to main banner
    sv.onended = () => exitOverlayRef.current?.();

    return () => {
      sv.oncanplay = null;
      sv.onended = null;
    };
  }, [showcaseProject, language]);

  // Play hackathon avatar video (intro) in the bottom-right slot; pause during feature playback
  useEffect(() => {
    if (!hackathonState) return;
    const sv = sectionVideoRef.current;
    if (!sv) return;

    if (hackathonState === 'playing') {
      // Mute/pause the avatar while a hackathon feature video plays
      sv.pause();
      return;
    }

    // 'picking' — load (if needed) and play the avatar intro
    const avatarSrc = HACKATHON_CONFIG.avatar?.[language] || HACKATHON_CONFIG.avatar?.EN;
    if (!avatarSrc) return;
    const fullSrc = `${ASSET_CONFIG.basePath}/${avatarSrc}`;

    sectionActiveRef.current = true;
    // Only reload if the source changed (avoids restarting on state toggles)
    if (!sv.src.endsWith(avatarSrc)) {
      sv.src = fullSrc;
      sv.loop = false;
      sv.muted = false;
      sv.load();
      let started = false;
      sv.oncanplay = () => {
        if (!started) {
          started = true;
          setSectionVisible(true);
          sv.play().catch(() => {});
        }
      };
      // When avatar finishes, close overlay and return to main banner
      sv.onended = () => exitOverlayRef.current?.();
    }
    // Don't restart on re-enter (state toggles) — dialog plays once per open

    return () => {
      sv.oncanplay = null;
      sv.onended = null;
    };
  }, [hackathonState, language]);

  // Load SRT and sync subtitles for hackathon avatar
  useEffect(() => {
    if (!hackathonState) return;
    const srtMap = HACKATHON_CONFIG.srt;
    if (!srtMap) return;
    const srtPath = srtMap[language] || srtMap.EN;
    if (!srtPath) return;

    let cancelled = false;
    fetch(`${ASSET_CONFIG.basePath}/${srtPath}`)
      .then(r => r.text())
      .then(text => {
        if (cancelled) return;
        const cues = [];
        const blocks = text.trim().split(/\n\n+/);
        for (const block of blocks) {
          const lines = block.split('\n');
          if (lines.length < 3) continue;
          const m = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
          if (!m) continue;
          const start = +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;
          const end = +m[5]*3600 + +m[6]*60 + +m[7] + +m[8]/1000;
          cues.push({ start, end, text: lines.slice(2).join(' ').trim() });
        }
        showcaseCuesRef.current = cues;

        const sync = () => {
          if (cancelled) return;
          const sv = sectionVideoRef.current;
          const t = sv?.currentTime ?? 0;
          const idx = cues.findIndex(c => t >= c.start && t < c.end);
          setShowcaseSubtitle(idx >= 0 ? cues[idx].text : '');
          showcaseSyncRef.current = requestAnimationFrame(sync);
        };
        showcaseSyncRef.current = requestAnimationFrame(sync);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (showcaseSyncRef.current) cancelAnimationFrame(showcaseSyncRef.current);
      setShowcaseSubtitle('');
    };
  }, [hackathonState, language]);

  // Load SRT and sync subtitles for genie avatar intro
  useEffect(() => {
    if (genieState !== 'idle' || !genieButtonsEnabled) return;
    const srtMap = GENIE_CONFIG.srt;
    if (!srtMap) return;
    const srtPath = srtMap[language] || srtMap.EN;
    if (!srtPath) return;

    let cancelled = false;
    fetch(`${ASSET_CONFIG.basePath}/${srtPath}`)
      .then(r => r.text())
      .then(text => {
        if (cancelled) return;
        const cues = [];
        const blocks = text.trim().split(/\n\n+/);
        for (const block of blocks) {
          const lines = block.split('\n');
          if (lines.length < 3) continue;
          const m = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
          if (!m) continue;
          const start = +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;
          const end = +m[5]*3600 + +m[6]*60 + +m[7] + +m[8]/1000;
          cues.push({ start, end, text: lines.slice(2).join(' ').trim() });
        }
        showcaseCuesRef.current = cues;

        const sync = () => {
          if (cancelled) return;
          const sv = sectionVideoRef.current;
          const t = sv?.currentTime ?? 0;
          const idx = cues.findIndex(c => t >= c.start && t < c.end);
          setShowcaseSubtitle(idx >= 0 ? cues[idx].text : '');
          showcaseSyncRef.current = requestAnimationFrame(sync);
        };
        showcaseSyncRef.current = requestAnimationFrame(sync);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (showcaseSyncRef.current) cancelAnimationFrame(showcaseSyncRef.current);
      setShowcaseSubtitle('');
    };
  }, [genieState, genieButtonsEnabled, language]);

  // Load SRT and sync subtitles + images to showcase avatar video
  useEffect(() => {
    if (!showcaseProject) {
      showcaseCuesRef.current = [];
      setShowcaseSubtitle('');
      if (showcaseSyncRef.current) cancelAnimationFrame(showcaseSyncRef.current);
      return;
    }
    const srtMap = PROJECT_SHOWCASE[showcaseProject]?.srt;
    if (!srtMap) return;
    const srtPath = srtMap[language] || srtMap.EN || srtMap.DE;
    if (!srtPath) return;

    let cancelled = false;
    fetch(`${ASSET_CONFIG.basePath}/${srtPath}`)
      .then(r => r.text())
      .then(text => {
        if (cancelled) return;
        // Parse SRT
        const cues = [];
        const blocks = text.trim().split(/\n\n+/);
        for (const block of blocks) {
          const lines = block.split('\n');
          if (lines.length < 3) continue;
          const m = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
          if (!m) continue;
          const start = +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000;
          const end = +m[5]*3600 + +m[6]*60 + +m[7] + +m[8]/1000;
          cues.push({ start, end, text: lines.slice(2).join(' ').trim() });
        }
        showcaseCuesRef.current = cues;

        // Animation frame loop — sync subtitle text + image index to video time
        let lastCueIdx = -1;
        const sync = () => {
          if (cancelled) return;
          const sv = sectionVideoRef.current;
          const t = sv?.currentTime ?? 0;
          const idx = cues.findIndex(c => t >= c.start && t < c.end);
          setShowcaseSubtitle(idx >= 0 ? cues[idx].text : '');
          if (idx >= 0 && idx !== lastCueIdx) {
            lastCueIdx = idx;
            setShowcaseImageIdx(idx % ((PROJECT_SHOWCASE[showcaseProject]?.media || PROJECT_SHOWCASE[showcaseProject]?.images)?.length || 1));
          }
          showcaseSyncRef.current = requestAnimationFrame(sync);
        };
        showcaseSyncRef.current = requestAnimationFrame(sync);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (showcaseSyncRef.current) cancelAnimationFrame(showcaseSyncRef.current);
    };
  }, [showcaseProject, language]);

  // Schedule next advance based on current media type (skip if SRT-driven)
  useEffect(() => {
    if (!showcaseProject || !showcaseMedia || showcaseMedia.length <= 1) return;
    // If SRT is driving image sync, don't use timer
    if (PROJECT_SHOWCASE[showcaseProject]?.srt) return;
    const current = showcaseMedia[showcaseImageIdx];
    const isVideo = current?.endsWith('.mp4');

    if (!isVideo) {
      // Image: advance after 3 seconds
      showcaseTimerRef.current = setTimeout(advanceShowcase, 3000);
      return () => clearTimeout(showcaseTimerRef.current);
    }
    // Video: wait for onEnded (handled in JSX)
  }, [showcaseProject, showcaseImageIdx, showcaseMedia, advanceShowcase]);

  // Preload all genie videos into blob URLs for instant playback
  const genieBlobsRef = useRef({});
  const preloadGenie = useCallback(async () => {
    const base = `${ASSET_CONFIG.basePath}/${GENIE_CONFIG.basePath}`;
    const files = [GENIE_CONFIG.enter, GENIE_CONFIG.greet, GENIE_CONFIG.idle,
      ...GENIE_CONFIG.actions.map(a => a.video)];
    await Promise.all(files.map(async (f) => {
      if (genieBlobsRef.current[f]) return;
      try {
        const res = await fetch(`${base}/${f}`);
        const blob = await res.blob();
        genieBlobsRef.current[f] = URL.createObjectURL(blob);
      } catch {}
    }));
  }, []);

  // Helper: get blob URL for a genie video (falls back to network)
  const genieUrl = useCallback((filename) => {
    return genieBlobsRef.current[filename] || `${ASSET_CONFIG.basePath}/${GENIE_CONFIG.basePath}/${filename}`;
  }, []);

  // Play a video on a given element, return promise that resolves when ended
  const playVideo = useCallback((el, filename, { loop = false, muted = false } = {}) => {
    if (!el) return Promise.resolve();
    return new Promise((resolve) => {
      el.src = genieUrl(filename);
      el.loop = loop;
      el.muted = muted;
      el.load();
      let started = false;
      el.oncanplay = () => { if (!started) { started = true; el.play().catch(() => {}); } };
      if (loop) { resolve(); } else { el.onended = resolve; el.onerror = resolve; }
    });
  }, [genieUrl]);

  // Start background idle (muted, always looping underneath as flicker safety net)
  const startBgIdle = useCallback(() => {
    playVideo(genieIdleRef.current, GENIE_CONFIG.idle, { loop: true, muted: true });
  }, [playVideo]);

  // Start foreground idle (with sound, looping on top)
  const startFgIdle = useCallback(() => {
    playVideo(genieActionRef.current, GENIE_CONFIG.idle, { loop: true, muted: false });
  }, [playVideo]);

  // Run enter → greet → idle sequence once genieState becomes 'entering'
  useEffect(() => {
    if (genieState !== 'entering') return;
    let cancelled = false;
    (async () => {
      const preloadPromise = preloadGenie();
      await playVideo(genieActionRef.current, GENIE_CONFIG.enter, { muted: false });
      if (cancelled) return;
      await preloadPromise;
      await playVideo(genieActionRef.current, GENIE_CONFIG.greet, { muted: false });
      if (cancelled) return;
      startBgIdle();
      startFgIdle();
      // Start Miguel avatar intro in bottom-right slot (plays once, no loop)
      const avatarSrc = GENIE_CONFIG.avatar?.[language] || GENIE_CONFIG.avatar?.EN;
      const sv = sectionVideoRef.current;
      if (avatarSrc && sv && !cancelled) {
        sectionActiveRef.current = true;
        sv.src = `${ASSET_CONFIG.basePath}/${avatarSrc}`;
        sv.loop = false;
        sv.muted = false;
        sv.load();
        sv.oncanplay = () => { setSectionVisible(true); sv.play().catch(() => {}); };
        sv.onended = () => setSectionVisible(false);
      }
      if (cancelled) return;
      setGenieState('idle');
      setGenieButtonsEnabled(true);
    })();
    return () => { cancelled = true; };
  }, [genieState, playVideo, startBgIdle, startFgIdle, preloadGenie, language]);

  // Handle genie action button click — play action on foreground with sound, bg idle continues
  const handleGenieAction = useCallback(async (actionVideo) => {
    if (genieState !== 'idle' || !genieButtonsEnabled) return;
    setGenieButtonsEnabled(false);
    setGenieState('action');

    // Play action on foreground (bg idle still looping muted underneath)
    await playVideo(genieActionRef.current, actionVideo, { muted: false });

    // Return to idle on foreground (with sound), bg idle still running
    startFgIdle();
    setGenieState('idle');
    setGenieButtonsEnabled(true);
  }, [genieState, genieButtonsEnabled, playVideo, startFgIdle]);

  // Universal close — resets all overlay state
  const exitOverlay = useCallback(() => {
    // Genie cleanup
    const iv = genieIdleRef.current;
    const av = genieActionRef.current;
    if (iv) { iv.pause(); iv.src = ''; }
    if (av) { av.pause(); av.src = ''; }
    setGenieState(null);
    setGenieButtonsEnabled(false);
    // Hackathon cleanup
    const hv = hackathonVideoRef.current;
    if (hv) { hv.onended = null; hv.onerror = null; hv.pause(); hv.src = ''; }
    setHackathonState(null);
    // Showcase cleanup
    const scv = showcaseVideoRef.current;
    if (scv) { scv.pause(); scv.removeAttribute('src'); scv.load(); }
    if (showcaseTimerRef.current) clearTimeout(showcaseTimerRef.current);
    if (showcaseSyncRef.current) cancelAnimationFrame(showcaseSyncRef.current);
    showcaseCuesRef.current = [];
    setShowcaseSubtitle('');
    setShowcaseProject(null);
    setShowcaseImageIdx(0);
    // Section cleanup
    sectionActiveRef.current = false;
    const sv = sectionVideoRef.current;
    if (sv) { sv.onended = null; sv.onerror = null; sv.oncanplay = null; sv.pause(); sv.removeAttribute('src'); sv.load(); }
    setSectionVisible(false);
    setActiveSection(null);
    setCurrentImages([]);
    setCycleImages([]);
    setHighlightedSection(null);
    setOverlayVisible(true);
  }, []);

  // Keep a ref to exitOverlay so earlier effects (defined above) can call it without TDZ
  exitOverlayRef.current = exitOverlay;

  // Expose simple methods to parent via ref
  useImperativeHandle(ref, () => ({
    exitOverlay,
    activateGenie() {
      exitOverlay();
      setOverlayVisible(false);
      setGenieState('entering');
    },
    activateHackathon() {
      exitOverlay();
      setOverlayVisible(false);
      setHackathonState('picking');
    },
    activateShowcase(title) {
      exitOverlay();
      setOverlayVisible(false);
      setShowcaseProject(title);
    },
  }), [exitOverlay]);

  // Play a hackathon video
  const playHackathonVideo = useCallback((videoFile) => {
    const v = hackathonVideoRef.current;
    if (!v) return;
    setHackathonState('playing');
    v.src = `${ASSET_CONFIG.basePath}/${HACKATHON_CONFIG.basePath}/${videoFile}`;
    v.muted = false;
    v.loop = false;
    v.load();
    let started = false;
    v.oncanplay = () => { if (!started) { started = true; v.play().catch(() => {}); } };
    v.onended = () => setHackathonState('picking');
    v.onerror = () => setHackathonState('picking');
  }, []);

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

    exitOverlay();

    const sectionVideo = sectionVideoRef.current;
    if (!sectionVideo) return;

    sectionActiveRef.current = true;
    setOverlayVisible(false);
    setActiveSection(section);

    let started = false;
    sectionVideo.src = `${ASSET_CONFIG.basePath}/${language}/${filename}`;
    sectionVideo.load();
    sectionVideo.oncanplay = () => {
      if (started || !sectionActiveRef.current) return;
      started = true;
      setSectionVisible(true);
      sectionVideo.play().catch(() => {});
    };
    sectionVideo.onended = () => exitOverlay();
    sectionVideo.onerror = () => exitOverlay();
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
          if (!sectionActiveRef.current) return;
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

      {/* Blur backdrop — behind images, subtitles, and avatar during section playback */}
      {sectionVisible && (
        <div className="absolute inset-0 z-[3] bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
      )}

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

      {/* Top-left: EN|DE toggle + Play intro — hidden during section playback */}
      <div className={`absolute top-3 left-3 z-[6] flex items-center gap-2 transition-opacity duration-300 ${overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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

      {/* Blur backdrop — behind genie videos during Genie Game */}
      {genieState && (
        <div className="absolute inset-0 z-[3] bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
      )}

      {/* Genie background layer — muted idle loop, flicker safety net */}
      <video
        ref={genieIdleRef}
        playsInline
        className="absolute z-[6] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-full max-w-full object-contain"
        style={{ opacity: genieState ? 1 : 0, pointerEvents: 'none' }}
      />
      {/* Genie foreground layer — current video with sound, always on top */}
      <video
        ref={genieActionRef}
        playsInline
        className="absolute z-[6] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-full max-w-full object-contain"
        style={{ opacity: genieState ? 1 : 0, pointerEvents: 'none' }}
      />

      {/* Genie intro subtitle (Miguel avatar in bottom-right) */}
      {genieState === 'idle' && showcaseSubtitle && (
        <div className="absolute bottom-10 left-0 right-0 z-[8] flex justify-center pointer-events-none">
          <p className="text-white text-[9px] sm:text-[10px] leading-snug text-center font-medium tracking-wide max-w-[60%]"
             style={{ textShadow: '0 0 4px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)' }}>
            {showcaseSubtitle}
          </p>
        </div>
      )}

      {/* Genie action buttons */}
      {genieState === 'idle' && (
        <div className="absolute bottom-3 left-0 right-0 z-[7] flex justify-center gap-1.5 px-4">
          {GENIE_CONFIG.actions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleGenieAction(action.video)}
              disabled={!genieButtonsEnabled}
              className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium tracking-wide border cursor-pointer transition-all bg-white/10 backdrop-blur-sm border-white/15 text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Blur backdrop — behind hackathon videos */}
      {hackathonState && (
        <div className="absolute inset-0 z-[3] bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
      )}

      {/* Hackathon video — centered, width = banner - 2×avatar width */}
      <video
        ref={hackathonVideoRef}
        playsInline
        className="absolute z-[6] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
        style={{ opacity: hackathonState === 'playing' ? 1 : 0, pointerEvents: 'none', maxHeight: '100%', maxWidth: '62%' }}
      />

      {/* Hackathon intro subtitle */}
      {hackathonState === 'picking' && showcaseSubtitle && (
        <div className="absolute bottom-2 left-0 right-0 z-[6] flex justify-center pointer-events-none">
          <p className="text-white text-[9px] sm:text-[10px] leading-snug text-center font-medium tracking-wide max-w-[60%]"
             style={{ textShadow: '0 0 4px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)' }}>
            {showcaseSubtitle}
          </p>
        </div>
      )}

      {/* Hackathon thumbnail picker — vertical, hidden during playback */}
      {hackathonState === 'picking' && (
        <div className="absolute inset-0 z-[7] flex flex-col items-center justify-evenly pt-2 pb-8 px-3 pointer-events-none">
          {HACKATHON_CONFIG.videos.map((item) => (
            <button
              key={item.label}
              onClick={() => playHackathonVideo(item.video)}
              className="pointer-events-auto group relative rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/60 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 flex-1 min-h-0"
            >
              <img
                src={`${ASSET_CONFIG.basePath}/${HACKATHON_CONFIG.basePath}/${item.thumb}`}
                alt={item.label}
                className="h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <span className="absolute bottom-0 left-0 right-0 text-[10px] sm:text-xs font-medium text-white text-center py-0.5 bg-black/50 backdrop-blur-sm">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Project showcase overlay */}
      {showcaseProject && PROJECT_SHOWCASE[showcaseProject] && (() => {
        const cfg = PROJECT_SHOWCASE[showcaseProject];
        const mediaList = cfg.media || cfg.images;
        const currentMedia = mediaList?.[showcaseImageIdx];
        const isVideo = currentMedia?.endsWith('.mp4');
        const subtitle = showcaseSubtitle || cfg.subtitles?.[showcaseImageIdx];
        return (
          <div className="absolute inset-0 z-[4] flex flex-col bg-black/60 backdrop-blur-sm">
            {/* Media — vertically centered, constrained to avoid avatar and subtitle */}
            <div className="flex-1 flex items-center justify-center" style={{ margin: '0 auto', paddingTop: '8px', paddingBottom: '32px', minHeight: 0, maxWidth: '62%' }}>
              {currentMedia && isVideo ? (
                <video
                  key={showcaseImageIdx}
                  ref={showcaseVideoRef}
                  src={`${ASSET_CONFIG.basePath}/${currentMedia}`}
                  autoPlay
                  muted
                  playsInline
                  onEnded={PROJECT_SHOWCASE[showcaseProject]?.srt ? undefined : advanceShowcase}
                  className="rounded-lg shadow-xl"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : currentMedia ? (
                <img
                  key={showcaseImageIdx}
                  src={`${ASSET_CONFIG.basePath}/${currentMedia}`}
                  alt={`${showcaseProject} ${showcaseImageIdx + 1}`}
                  className="rounded-lg shadow-xl transition-opacity duration-500"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : cfg.image ? (
                <img
                  src={`${ASSET_CONFIG.basePath}/images/${cfg.image}`}
                  alt={showcaseProject}
                  className="rounded-lg shadow-xl"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <h2 className="text-white text-lg sm:text-xl font-bold tracking-tight drop-shadow-lg">
                    {showcaseProject}
                  </h2>
                  <ul className="text-left space-y-1.5">
                    {cfg.bullets.map((b, i) => (
                      <li key={i} className="text-white/90 text-[10px] sm:text-xs leading-snug flex items-start gap-1.5">
                        <span className="text-blue-400 mt-0.5">&#x2022;</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Subtitle — bottom center, matching existing subtitle style */}
            {subtitle && (
              <div className="absolute bottom-2 left-0 right-0 z-[6] flex justify-center pointer-events-none">
                <p className="text-white text-[9px] sm:text-[10px] leading-snug text-center font-medium tracking-wide max-w-[60%]"
                   style={{ textShadow: '0 0 4px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)' }}>
                  {subtitle}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Universal close button — shown for any overlay (genie, hackathon, showcase) */}
      {(genieState || hackathonState || showcaseProject) && (
        <button
          onClick={exitOverlay}
          className="absolute top-3 left-3 z-[8] text-white/60 hover:text-white transition-colors cursor-pointer"
          aria-label="Close overlay"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

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
});

export default Banner;
