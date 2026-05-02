'use client';

import { useState, useRef, useEffect } from 'react';
import Banner, { PROJECT_SEGMENTS, PROJECT_SHOWCASE } from './components/Banner';

// TODO: replace placeholder URLs with real profile links
const SOCIALS = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/miguel-lacanienta/',
    svg: (
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path fill="white" d="M7.06 9.5h-3v9h3v-9zM5.56 5.05c-.97 0-1.75.78-1.75 1.75s.78 1.75 1.75 1.75 1.75-.78 1.75-1.75-.78-1.75-1.75-1.75zM20.5 18.5h-3v-4.6c0-1.1-.9-2-2-2s-2 .9-2 2v4.6h-3v-9h3v1.2c.7-1 1.8-1.5 3-1.5 2.2 0 4 1.8 4 4v5.3z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/playlist?list=PLwgavg1OXIfGKhX9FHoEG0aIbhMaj5dEH',
    svg: (
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <rect x="0" y="3.5" width="24" height="17" rx="4" fill="#FF0000" />
        <polygon points="10,8 10,16 16,12" fill="white" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@mlacanienta',
    svg: (
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="black" />
        {/* cyan ghost */}
        <path
          fill="#25F4EE"
          transform="translate(-1 1)"
          d="M16.5 7.6a3.6 3.6 0 0 1-2.8-3.2v-.3h-2.6v9.7c0 1.2-1 2.2-2.2 2.2a2.2 2.2 0 0 1-1.7-3.6 2.2 2.2 0 0 1 1.7-.8c.2 0 .5 0 .7.1v-2.6a4.7 4.7 0 0 0-.7 0 4.7 4.7 0 0 0-3.4 8 4.8 4.8 0 0 0 8.1-3.4v-5a6.1 6.1 0 0 0 3.5 1.1V7.5a3.6 3.6 0 0 1-.6 0z"
        />
        {/* magenta ghost */}
        <path
          fill="#FE2C55"
          transform="translate(1 -1)"
          d="M16.5 7.6a3.6 3.6 0 0 1-2.8-3.2v-.3h-2.6v9.7c0 1.2-1 2.2-2.2 2.2a2.2 2.2 0 0 1-1.7-3.6 2.2 2.2 0 0 1 1.7-.8c.2 0 .5 0 .7.1v-2.6a4.7 4.7 0 0 0-.7 0 4.7 4.7 0 0 0-3.4 8 4.8 4.8 0 0 0 8.1-3.4v-5a6.1 6.1 0 0 0 3.5 1.1V7.5a3.6 3.6 0 0 1-.6 0z"
        />
        {/* white note */}
        <path
          fill="white"
          d="M16.5 7.6a3.6 3.6 0 0 1-2.8-3.2v-.3h-2.6v9.7c0 1.2-1 2.2-2.2 2.2a2.2 2.2 0 0 1-1.7-3.6 2.2 2.2 0 0 1 1.7-.8c.2 0 .5 0 .7.1v-2.6a4.7 4.7 0 0 0-.7 0 4.7 4.7 0 0 0-3.4 8 4.8 4.8 0 0 0 8.1-3.4v-5a6.1 6.1 0 0 0 3.5 1.1V7.5a3.6 3.6 0 0 1-.6 0z"
        />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/mlacanienta',
    svg: (
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path
          fill="white"
          d="M13.5 8.5h1.7V6h-1.7c-1.66 0-3 1.34-3 3v1.5H8.5v2.5h2v6h2.5v-6h2l.5-2.5h-2.5V9c0-.28.22-.5.5-.5z"
        />
      </svg>
    ),
  },
];

function SocialIcons({ size = 'sm' }) {
  const sz = size === 'lg' ? 'w-8 h-8' : size === 'xs' ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-2">
      {SOCIALS.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          className={`${sz} hover:scale-110 transition-transform`}
        >
          {s.svg}
        </a>
      ))}
    </div>
  );
}

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
        <div className="max-w-4xl mx-auto px-4 py-3 grid grid-cols-3 items-center gap-3">
          <span className="text-base sm:text-lg font-medium text-gray-800 truncate">
            Miguel Lacanienta
          </span>
          <nav className="flex justify-center items-center gap-1">
            <a
              href="https://miguel-app.pages.dev/"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Resume
            </a>
            <a
              href="https://miguel-folio.pages.dev/"
              aria-current="page"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-900 text-white"
            >
              Portfolio
            </a>
            <a
              href="https://miguel-ai.vercel.app/cover-letter"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Cover Letter
            </a>
          </nav>
          <div className="flex justify-end">
            <SocialIcons />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-3">
        {/* Video Header */}
        <Banner ref={bannerRef} onProjectHighlight={setHighlightedProject} />

        {/* Projects Section */}
        <div className="mt-4">
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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-2 text-center">
          <p className="text-[11px] text-gray-500">© {new Date().getFullYear()} Miguel Lacanienta</p>
        </div>
      </footer>
    </div>
  );
}
