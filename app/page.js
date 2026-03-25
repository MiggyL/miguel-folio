'use client';

import { useState, useRef, useCallback } from 'react';
import { ASSET_CONFIG } from '@/lib/assets';

const PROJECTS = [
  { title: 'DTR System', description: 'POC for a daily time record system with calendar view. Solo-built, no docs.', tech: ['Node.js', 'Express.js', 'MongoDB', 'AngularJS'] },
  { title: 'Interactive Resume', description: 'AI chat with Llama, Gemma & Mistral APIs. Lip-sync avatars in EN/DE.', tech: ['Next.js', 'Kiro', 'ChatGPT', 'Claude', 'ElevenLabs', 'Sora 2'] },
  { title: 'PPE Detection (Thesis)', description: 'Real-time PPE monitoring via YOLOv9. Alerts managers on Telegram.', tech: ['Python', 'YOLOv9', 'Google Colab'] },
  { title: 'Sheets-to-Form Automation', description: 'Chrome extension automating Google Sheets to web form data entry.', tech: ['Python', 'Flask', 'Selenium'] },
  { title: 'Food Price Forecasting', description: 'Time-series forecasting for food prices using ARIMA.', tech: ['Orange Data Mining', 'ARIMA'] },
  { title: 'Local LLM App', description: 'Local language generation with LangChain & Mistral-7B.', tech: ['LangChain', 'Hugging Face', 'Mistral-7B'] },
  { title: 'YouTube Q&A Tool', description: 'Extracts video transcripts and answers questions from content.', tech: ['Auto-GPT', 'YouTube API'] },
  { title: 'RPSLS Game', description: 'Rock Paper Scissors Lizard Spock on RonnieAI for Digital Data Day.', tech: ['Adaptive Cards', 'Game Design'] },
  { title: 'HTTYD Telegram Bots', description: 'Dragon character bots for "How To Train Your AI Dragon" game.', tech: ['Telegram BotFather'] },
  { title: 'Hackathon Videos', description: 'Videos for r/factchecker, RecruitBolt & SpecSync on Devpost.', tech: ['Amazon Polly TTS', 'Video Production'] },
  { title: 'Genie Game', description: 'Voice generation & lip-sync for the Genie character at Inspire.', tech: ['ElevenLabs', 'CapCut'] },
];

// Each project with storyboard videos gets a segments config.
// segments: array of mp4 filenames in public/
// labels: matching array of overlay labels shown during playback
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

export default function Home() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(-1);
  const [activeProject, setActiveProject] = useState(null);

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

    // Return to idle banner
    setCurrentSegment(-1);
    setIsPlaying(false);
    setActiveProject(null);
    video.loop = true;
    video.src = `${ASSET_CONFIG.basePath}/idle_banner.mp4`;
    video.load();
    video.play().catch(() => {});
  }, [isPlaying]);

  const handleCardClick = (title) => {
    if (PROJECT_SEGMENTS[title]) {
      playSegments(title);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1f1f1f] overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-full p-0.5">
              <a
                href="https://miguel-app.pages.dev/"
                className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Resume
              </a>
              <a
                href="https://miguel-folio.pages.dev/"
                className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-900 shadow-sm"
              >
                Portfolio
              </a>
            </div>
            <span className="text-lg font-medium text-gray-800">
              Miguel Lacanienta
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Video Header */}
        <div className="relative bg-black rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="w-full" style={{ aspectRatio: '1173/640' }}>
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src={`${ASSET_CONFIG.basePath}/idle_banner.mp4`}
            />
          </div>

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

        {/* Projects Section */}
        <div className="mt-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {PROJECTS.map((project) => (
              <div
                key={project.title}
                onClick={() => handleCardClick(project.title)}
                className={`bg-white rounded-xl p-3 border transition-all duration-200 ${
                  PROJECT_SEGMENTS[project.title]
                    ? 'border-blue-300 hover:border-blue-500 hover:shadow-lg cursor-pointer ring-1 ring-blue-100'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                } ${
                  activeProject === project.title
                    ? 'animate-pulse border-blue-500 ring-2 ring-blue-300'
                    : ''
                }`}
              >
                <h5 className="text-xs font-semibold text-gray-900 mb-1">
                  {project.title}
                  {PROJECT_SEGMENTS[project.title] && (
                    <span className="ml-1 text-[9px] text-blue-500 font-normal">
                      {activeProject === project.title ? '▶ Playing...' : '▶ Click to play'}
                    </span>
                  )}
                </h5>
                <p className="text-[10px] text-gray-500 leading-snug mb-2">{project.description}</p>
                <div className="flex flex-wrap gap-1">
                  {project.tech.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-600">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
