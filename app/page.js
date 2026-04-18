'use client';

import { useState, useRef, useEffect } from 'react';
import Banner, { PROJECT_SEGMENTS, PROJECT_SHOWCASE } from './components/Banner';

const PROJECTS = [
  { title: 'DTR System', description: 'POC for a daily time record system with calendar view. Solo-built, no docs.', tech: ['Node.js', 'Express.js', 'MongoDB', 'AngularJS'] },
  { title: 'PPE Detection (Thesis)', description: 'Real-time PPE monitoring via YOLOv9. Alerts managers on Telegram.', tech: ['Python', 'YOLOv9', 'Google Colab'] },
  { title: 'Sheets-to-Form Automation', description: 'Chrome extension automating bulk digital asset uploads from Google Sheets to web forms.', tech: ['Python', 'Flask', 'Selenium'] },
  { title: 'Food Price Forecasting', description: 'ARIMA time-series forecasting for Philippine food prices using WFP data.', tech: ['Orange Data Mining', 'ARIMA'] },
  { title: 'Local LLM App', description: 'Local language generation with LangChain & Mistral-7B.', tech: ['LangChain', 'Hugging Face', 'Mistral-7B'] },
  { title: 'YouTube Q&A Tool', description: 'Google Colab notebook that extracts YouTube transcripts and answers questions via RAG.', tech: ['LangChain', 'FAISS', 'Mistral-7B'] },
  { title: 'RPSLS Game', description: 'Knockout RPSLS tournament for hundreds of players at Digital Data Day Manila.', tech: ['Bot Framework', 'Adaptive Cards'] },
  { title: 'HTTYD Telegram Bots', description: 'Dragon character bots for "How To Train Your AI Dragon" game.', tech: ['Telegram BotFather'] },
  { title: 'Hackathon Videos', description: 'Videos for r/factchecker, RecruitBolt & SpecSync on Devpost.', tech: ['Amazon Polly TTS', 'Video Production'] },
  { title: 'Genie Game', description: 'Voice generation & lip-sync for the Genie character at Inspire.', tech: ['ElevenLabs', 'CapCut'] },
];


function TechTags({ tech, maxVisible = 2 }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);
  const visible = tech.slice(0, maxVisible);
  const hidden = tech.slice(maxVisible);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

  return (
    <div className="flex items-center gap-1">
      {visible.map((t) => (
        <span key={t} className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-600">
          {t}
        </span>
      ))}
      {hidden.length > 0 && (
        <>
          <button
            ref={btnRef}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
          >
            +{hidden.length} more
          </button>
          {open && pos && (
            <div
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              style={{ position: 'fixed', top: pos.top, left: pos.left }}
              className="z-50 flex flex-wrap gap-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-max"
            >
              {hidden.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-600">
                  {t}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Home() {
  const bannerRef = useRef(null);
  const [highlightedProject, setHighlightedProject] = useState(null);

  const handleCardClick = (title) => {
    if (title === 'Genie Game') {
      bannerRef.current?.activateGenie();
    } else if (title === 'Hackathon Videos') {
      bannerRef.current?.activateHackathon();
    } else if (PROJECT_SHOWCASE[title]) {
      bannerRef.current?.activateShowcase(title);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1f1f1f] overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
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
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Video Header */}
        <Banner ref={bannerRef} onProjectHighlight={setHighlightedProject} />

        {/* Projects Section */}
        <div className="mt-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {PROJECTS.map((project) => {
              const isHighlighted = highlightedProject === project.title;
              const isDimmed = highlightedProject !== null && !isHighlighted;
              return (
              <div
                key={project.title}
                onClick={() => handleCardClick(project.title)}
                className={`bg-white rounded-xl p-3 border overflow-visible cursor-pointer transition-all duration-300 ${
                  isHighlighted
                    ? 'border-blue-400 ring-2 ring-blue-400 shadow-xl scale-[1.03] z-10 relative'
                    : isDimmed
                    ? 'border-gray-200 opacity-30 blur-[1px]'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                <h5 className="text-xs font-semibold text-gray-900 mb-1">
                  {project.title}
                </h5>
                <p className="text-[10px] text-gray-500 leading-snug mb-2">{project.description}</p>
                <TechTags tech={project.tech} />
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
