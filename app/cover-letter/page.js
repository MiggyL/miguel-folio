'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import FloatingControls from '../components/FloatingControls';

// Chrome dino game — same lazy-loaded import the resume Banner uses.
const ChromeDino = dynamic(
  () => import('react-chrome-dino').then((m) => m.default || m),
  { ssr: false }
);

/* ----- Configuration ----- */

// All media is served from miguel-app.pages.dev's CDN — same as Banner.js
// uses today. Hardcoded so this page is portable across deployments
// (static export sites can drop it in without their own asset config).
const V2_BASE = 'https://miguel-app.pages.dev/v2';

// API endpoint for the LLM. Static-export deployments can't host the
// route themselves, so they POST to miguel-ai's Vercel deployment which
// has CORS enabled. On miguel-ai itself NEXT_PUBLIC_COVER_LETTER_API
// can stay unset → uses the relative path.
const API_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_COVER_LETTER_API) ||
  'https://miguel-ai.vercel.app/api/cover-letter';

const MODELS = [
  {
    id: 'groq',
    name: 'Llama 3.3 70B',
    provider: 'Groq',
    description: 'Fast and efficient',
    dot: '#F55036',
  },
  {
    id: 'mistral',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    description: 'European AI powerhouse',
    dot: '#FA520F',
  },
  {
    id: 'gemini',
    name: 'Gemma 3 27B',
    provider: 'Google',
    description: "Google's Gemma model",
    dot: '#1A73E8',
  },
];

const MODELS_BY_ID = Object.fromEntries(MODELS.map((m) => [m.id, m]));

const CV_URL =
  'https://drive.google.com/file/d/1RyQRN930zeyjLZe2o_J52zWEB1kWyWQF';
const MIGUEL_EMAIL = 'mmlacanienta@gmail.com';
const RESUME_URL = 'https://miguel-app.pages.dev/';
const PORTFOLIO_URL = 'https://miguel-folio.pages.dev/';

const EXAMPLE = {
  company: 'Cambridge University Press & Assessment',
  role: 'Senior Software Engineer (AI Tools)',
  jd:
    'We are looking for a senior engineer to build internal AI tooling. Strong Python, experience with LangChain or RAG, cloud (Azure preferred), and a track record of shipping end-to-end features. Bonus: computer vision or LLM fine-tuning.',
  recruiterName: 'Alex',
};

/* ----- Header pieces (rendered locally so global app/page.js stays untouched) ----- */

const TABS = [
  { id: 'resume', label: 'Resume', href: RESUME_URL },
  { id: 'portfolio', label: 'Portfolio', href: PORTFOLIO_URL },
  { id: 'cover-letter', label: 'Cover Letter', href: '/cover-letter' },
];

function HeaderTabs({ active }) {
  return (
    <nav className="flex items-center gap-1">
      {TABS.map((t) => (
        <a
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? 'page' : undefined}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            active === t.id
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}

const SOCIALS = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/miguel-lacanienta/',
    svg: (
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path
          fill="white"
          d="M7.06 9.5h-3v9h3v-9zM5.56 5.05c-.97 0-1.75.78-1.75 1.75s.78 1.75 1.75 1.75 1.75-.78 1.75-1.75-.78-1.75-1.75-1.75zM20.5 18.5h-3v-4.6c0-1.1-.9-2-2-2s-2 .9-2 2v4.6h-3v-9h3v1.2c.7-1 1.8-1.5 3-1.5 2.2 0 4 1.8 4 4v5.3z"
        />
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
        <path
          fill="#25F4EE"
          transform="translate(-1 1)"
          d="M16.5 7.6a3.6 3.6 0 0 1-2.8-3.2v-.3h-2.6v9.7c0 1.2-1 2.2-2.2 2.2a2.2 2.2 0 0 1-1.7-3.6 2.2 2.2 0 0 1 1.7-.8c.2 0 .5 0 .7.1v-2.6a4.7 4.7 0 0 0-.7 0 4.7 4.7 0 0 0-3.4 8 4.8 4.8 0 0 0 8.1-3.4v-5a6.1 6.1 0 0 0 3.5 1.1V7.5a3.6 3.6 0 0 1-.6 0z"
        />
        <path
          fill="#FE2C55"
          transform="translate(1 -1)"
          d="M16.5 7.6a3.6 3.6 0 0 1-2.8-3.2v-.3h-2.6v9.7c0 1.2-1 2.2-2.2 2.2a2.2 2.2 0 0 1-1.7-3.6 2.2 2.2 0 0 1 1.7-.8c.2 0 .5 0 .7.1v-2.6a4.7 4.7 0 0 0-.7 0 4.7 4.7 0 0 0-3.4 8 4.8 4.8 0 0 0 8.1-3.4v-5a6.1 6.1 0 0 0 3.5 1.1V7.5a3.6 3.6 0 0 1-.6 0z"
        />
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

function SocialIcons() {
  return (
    <div className="flex items-center gap-2">
      {SOCIALS.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          className="w-6 h-6 hover:scale-110 transition-transform"
        >
          {s.svg}
        </a>
      ))}
    </div>
  );
}

/* ----- Flag toggle ----- */

function FlagUK() {
  return (
    <svg
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full block"
      aria-hidden="true"
    >
      <clipPath id="cl-uk-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#cl-uk-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="white" strokeWidth="6" />
        <path
          d="M0,0 60,30 M60,0 0,30"
          stroke="#C8102E"
          strokeWidth="3"
          clipPath="url(#cl-uk-clip)"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="white" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagDE() {
  return (
    <svg
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full block"
      aria-hidden="true"
    >
      <rect y="0" width="60" height="10" fill="#000000" />
      <rect y="10" width="60" height="10" fill="#DD0000" />
      <rect y="20" width="60" height="10" fill="#FFCE00" />
    </svg>
  );
}

function FlagToggle({ language, onChange }) {
  const opts = [
    { id: 'EN', flag: <FlagUK />, label: 'English' },
    { id: 'DE', flag: <FlagDE />, label: 'Deutsch' },
  ];
  return (
    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
      {opts.map((o) => {
        const active = language === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            title={`Output language: ${o.label}`}
            aria-pressed={active}
            className={`flex items-center justify-center w-7 h-7 rounded-md overflow-hidden transition-all ${
              active
                ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-slate-100'
                : 'opacity-40 hover:opacity-80'
            }`}
          >
            {o.flag}
          </button>
        );
      })}
    </div>
  );
}

/* ----- Page ----- */

export default function CoverLetterPage() {
  const [form, setForm] = useState({
    company: '',
    role: '',
    jd: '',
    recruiterName: '',
    language: 'EN',
    model: 'groq',
    // tone is always "professional" — sent server-side, not user-controlled
  });
  const [letter, setLetter] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [picked, setPicked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const audioRef = useRef(null);
  const resultRef = useRef(null);

  // ESC closes the dino game (mirrors Banner's behavior).
  useEffect(() => {
    if (!gameOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setGameOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOpen]);

  // react-chrome-dino can mount duplicate canvases on hot-reload. Prune them.
  useEffect(() => {
    if (!gameOpen) return;
    const host = document.getElementById('cover-letter-dino-host');
    if (!host) return;
    const prune = () => {
      const canvases = host.querySelectorAll('canvas.runner-canvas');
      for (let i = 1; i < canvases.length; i++) canvases[i].remove();
    };
    prune();
    const obs = new MutationObserver(prune);
    obs.observe(host, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [gameOpen]);

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

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fillExample = () => setForm((f) => ({ ...f, ...EXAMPLE }));

  // Cmd/Ctrl+Enter on any input triggers Generate
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!loading && form.company.trim() && form.role.trim()) {
          generate();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loading]);

  const generate = async (e) => {
    e?.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and role are required.');
      return;
    }
    setError('');
    setLoading(true);
    setLetter('');
    setPicked([]);
    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate', tone: 'professional', ...form }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');
      setLetter(data.letter);
      setUsedModel(data.model || form.model);
      setPicked(data.pickedProjects || []);
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const downloadLetter = () => {
    const blob = new Blob([letter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = (form.company || 'cover-letter')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .replace(/^-|-$/g, '');
    a.href = url;
    a.download = `cover-letter-${safe}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const mailtoHref = () => {
    const subject = encodeURIComponent(
      `Re: ${form.role || 'a role'} at ${form.company || 'your company'}`
    );
    const body = encodeURIComponent(
      `Hi Miguel,\n\nI work at ${form.company}. I tried your cover-letter generator and would love to talk about ${form.role || 'a role'}.\n\n— Sent from miguel-ai.vercel.app`
    );
    return `mailto:${MIGUEL_EMAIL}?subject=${subject}&body=${body}`;
  };

  const wordCount = letter ? letter.trim().split(/\s+/).length : 0;
  const canGenerate = !loading && form.company.trim() && form.role.trim();

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#1f1f1f] overflow-x-hidden">
      {/* Sticky header — desktop: name left / tabs centered / socials right.
          Mobile: name + socials on row 1, tabs on row 2 (so 3 tabs don't
          squeeze the socials off-screen). */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
            <span className="text-base sm:text-lg font-medium text-gray-800 truncate">
              Miguel Lacanienta
            </span>
            <div className="sm:hidden">
              <SocialIcons />
            </div>
          </div>
          <div className="flex justify-center">
            <HeaderTabs active="cover-letter" />
          </div>
          <div className="hidden sm:flex justify-end">
            <SocialIcons />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 pb-24">
        {/* Self-contained banner — bg video + idle avatar + EN|DE + mute +
            CV — with the form overlaid in the centre. Same shape and
            controls as the Portfolio Banner, but without depending on
            Banner.js so this page can be dropped into any of the four
            Miguel deployments. */}
        <CoverLetterBanner
          language={form.language}
          onLanguageChange={(v) => set('language', v)}
          isMuted={isMuted}
          onToggleMute={toggleAudio}
          audioRef={audioRef}
          isPlayingIntro={isPlayingIntro}
          onPlayIntro={() => setIsPlayingIntro(true)}
          onIntroEnded={() => setIsPlayingIntro(false)}
        >
          <div className="absolute inset-0 z-[6] flex items-center justify-center px-4 sm:px-8 pt-12 pb-16 sm:pt-14 sm:pb-12 pointer-events-none">
            <div className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-white/40 p-4 sm:p-5 pointer-events-auto">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Tell me about your role
                </h2>
                <button
                  type="button"
                  onClick={fillExample}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium shrink-0"
                >
                  Fill with example →
                </button>
              </div>
              <form onSubmit={generate} className="space-y-2.5">
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <Input
                    label="Company"
                    required
                    value={form.company}
                    onChange={update('company')}
                    placeholder="ACME Corp"
                    maxLength={200}
                  />
                  <Input
                    label="Role"
                    required
                    value={form.role}
                    onChange={update('role')}
                    placeholder="Senior Software Engineer"
                    maxLength={200}
                  />
                </div>
                <Input
                  label="Recruiter name"
                  optional
                  value={form.recruiterName}
                  onChange={update('recruiterName')}
                  placeholder="Hiring Manager"
                  maxLength={120}
                />
                <Textarea
                  label="Job description"
                  value={form.jd}
                  onChange={update('jd')}
                  placeholder="Paste the JD — makes the letter specific."
                  maxLength={6000}
                  rows={3}
                />
              </form>

              {/* Split-button CTA — gradient Draft on left, model picker on right */}
              <div
                className={`group mt-3 relative flex items-stretch rounded-xl transition-all ${
                  canGenerate
                    ? 'shadow-md shadow-violet-500/25 hover:shadow-lg'
                    : 'shadow-sm'
                } ${!canGenerate ? 'opacity-60' : ''}`}
                style={{
                  background:
                    'linear-gradient(120deg, #7c3aed 0%, #6366f1 50%, #2563eb 100%)',
                }}
              >
                <button
                  type="button"
                  onClick={generate}
                  disabled={!canGenerate}
                  className="relative flex-1 overflow-hidden rounded-l-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed transition-transform hover:bg-white/5 active:scale-[0.99]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Spinner /> Drafting…
                      </>
                    ) : (
                      <>
                        <SparkleIcon />{' '}
                        {letter ? 'Regenerate' : 'Draft the letter'}
                      </>
                    )}
                  </span>
                  {canGenerate && (
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  )}
                </button>
                <div className="w-px bg-white/25 my-2" />
                <InlineModelMenu
                  value={form.model}
                  onChange={(m) => set('model', m)}
                />
              </div>
            </div>
          </div>
        </CoverLetterBanner>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Result */}
        {(letter || loading) && (
          <section ref={resultRef} className="mt-8">
            {picked.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                  Matched on
                </span>
                {picked.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    {p}
                  </span>
                ))}
                {usedModel && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium ml-auto">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          MODELS_BY_ID[usedModel]?.dot || '#fff',
                      }}
                    />
                    {MODELS_BY_ID[usedModel]?.name || usedModel}
                  </span>
                )}
              </div>
            )}

            <Letterhead loading={loading && !letter}>
              {letter && (
                <p className="whitespace-pre-wrap font-serif text-[16.5px] leading-[1.75] text-slate-800">
                  {letter}
                </p>
              )}
            </Letterhead>

            {letter && (
              <>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{wordCount} words</span>
                  <span className="font-mono">
                    {wordCount < 200
                      ? '↓ short'
                      : wordCount > 280
                      ? '↑ long'
                      : '✓ standard length'}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <ActionButton onClick={copyLetter}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </ActionButton>
                  <ActionButton onClick={downloadLetter}>
                    Download .txt
                  </ActionButton>
                  <a
                    href={mailtoHref()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Talk to Miguel about this role
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </>
            )}
          </section>
        )}

        <p className="mt-10 pt-5 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
          Letters are generated by an LLM; review carefully before sending.
          Some companies have policies about AI-assisted applications. Inputs
          aren't stored.
        </p>
      </main>

      <FloatingControls
        language={form.language}
        onLanguageChange={(v) => set('language', v)}
        isMuted={isMuted}
        onToggleMute={toggleAudio}
        onPlayAbout={() => setIsPlayingIntro(true)}
        onPlayGame={() => setGameOpen(true)}
        cvHref={CV_URL}
      />

      {gameOpen && (
        <div className="fixed inset-0 z-[80] bg-white overflow-hidden">
          <div className="w-full h-full flex flex-col justify-center" id="cover-letter-dino-host">
            <ChromeDino />
          </div>
          <button
            type="button"
            onClick={() => setGameOpen(false)}
            className="absolute top-3 right-3 z-[81] w-9 h-9 rounded-full bg-gray-900/90 text-white hover:bg-gray-800 flex items-center justify-center cursor-pointer shadow-lg"
            aria-label="Close game"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ----- Reusable form sub-components ----- */

function Input({ label, required, optional, hint, ...rest }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </span>
        {optional && (
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            optional
          </span>
        )}
      </span>
      <input
        {...rest}
        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-colors"
      />
      {hint && (
        <span className="block text-[11px] text-slate-500 mt-1.5">{hint}</span>
      )}
    </label>
  );
}

function Textarea({ label, hint, value, maxLength, ...rest }) {
  const len = (value || '').length;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        {maxLength && (
          <span
            className={`text-[10px] font-mono ${
              len > maxLength * 0.9 ? 'text-rose-500' : 'text-slate-400'
            }`}
          >
            {len.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        )}
      </span>
      <textarea
        value={value}
        maxLength={maxLength}
        {...rest}
        className="w-full px-3.5 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-colors resize-y"
      />
      {hint && (
        <span className="block text-[11px] text-slate-500 mt-1.5">{hint}</span>
      )}
    </label>
  );
}

function ActionButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
    >
      {children}
    </button>
  );
}

function Letterhead({ loading, children }) {
  return (
    <div
      className="relative rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.12)] overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FDFCF8 0%, #FAF8F1 100%)',
      }}
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
      <div className="px-6 sm:px-12 py-10 sm:py-14 min-h-[20rem]">
        {loading ? (
          <div className="space-y-3">
            {[100, 95, 88, 92, 80, 70].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded bg-slate-200/80 animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:120ms]" />
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:240ms]" />
    </span>
  );
}

function InlineModelMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const current = MODELS_BY_ID[value] || MODELS[0];
  return (
    <div ref={ref} className="relative flex items-stretch">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-2 px-3.5 sm:px-4 rounded-r-xl text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors"
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: current.dot }}
        />
        <span className="hidden sm:inline">{current.name}</span>
        <span className="sm:hidden">{current.name.split(' ')[0]}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden p-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className={`w-full text-left p-3 rounded-xl transition-colors ${
                value === m.id
                  ? 'bg-violet-50 ring-2 ring-violet-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-0.5">
                <div>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: m.dot }}
                    />
                    {m.name}
                  </div>
                  <div className="text-xs text-slate-500 ml-3">{m.provider}</div>
                </div>
                {value === m.id && (
                  <svg
                    className="w-4 h-4 text-violet-600 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-600 ml-3">{m.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----- Self-contained cover-letter banner (no Banner.js dependency) ----- */

function CoverLetterBanner({
  language,
  onLanguageChange,
  isMuted,
  onToggleMute,
  audioRef,
  isPlayingIntro,
  onPlayIntro,
  onIntroEnded,
  children,
}) {
  const introRef = useRef(null);

  // Drive the intro video. When isPlayingIntro flips true, swap src to the
  // cover-letter intro for the current language and play unmuted; on ended
  // / errored, notify parent so the idle resumes.
  useEffect(() => {
    const v = introRef.current;
    if (!v) return;
    if (isPlayingIntro) {
      v.src = `/cover-letter/cover-${language.toLowerCase()}.mp4`;
      v.loop = false;
      v.muted = false;
      v.currentTime = 0;
      const onEnd = () => onIntroEnded?.();
      const onErr = () => onIntroEnded?.();
      v.addEventListener('ended', onEnd);
      v.addEventListener('error', onErr);
      v.play().catch(() => onIntroEnded?.());
      return () => {
        v.removeEventListener('ended', onEnd);
        v.removeEventListener('error', onErr);
      };
    } else {
      v.pause();
      v.removeAttribute('src');
      v.load();
    }
  }, [isPlayingIntro, language, onIntroEnded]);

  return (
    <div className="relative bg-black rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <audio ref={audioRef} loop src={`${V2_BASE}/ambient.mp3`} />
      <div className="w-full aspect-[4/5] md:aspect-[1173/640]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src={`${V2_BASE}/bg.mp4`}
        />
      </div>

      {/* Idle avatar overlay — bottom-right, always playing */}
      <video
        autoPlay
        loop
        muted
        playsInline
        onClick={() => onPlayIntro?.()}
        className="absolute bottom-0 right-0 object-cover rounded-br-2xl h-[45%] md:h-[35%] cursor-pointer"
        style={{ aspectRatio: '1/1', zIndex: 5 }}
        src={`${V2_BASE}/idle.mp4`}
      />

      {/* Intro video overlay — sits on top of the idle, only visible while playing */}
      <video
        ref={introRef}
        playsInline
        className={`absolute bottom-0 right-0 object-cover rounded-br-2xl h-[45%] md:h-[35%] transition-opacity duration-300 ${
          isPlayingIntro ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ aspectRatio: '1/1', zIndex: 7 }}
      />

      {/* Top-left: EN|DE toggle + Play intro button */}
      <div className="absolute top-3 left-3 z-[6] flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-md opacity-50 hover:opacity-100 transition-all">
          <button
            type="button"
            onClick={() => onLanguageChange('EN')}
            className={`text-[11px] sm:text-xs font-medium tracking-wide cursor-pointer transition-colors ${
              language === 'EN'
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            EN
          </button>
          <span className="text-white/30 text-[11px]">|</span>
          <button
            type="button"
            onClick={() => onLanguageChange('DE')}
            className={`text-[11px] sm:text-xs font-medium tracking-wide cursor-pointer transition-colors ${
              language === 'DE'
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            DE
          </button>
        </div>
        <button
          type="button"
          onClick={() => onPlayIntro?.()}
          className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Play about"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        </button>
      </div>

      {/* Top-right: mute toggle */}
      <button
        type="button"
        onClick={onToggleMute}
        className="absolute top-3 right-3 z-10 opacity-50 hover:opacity-80 transition-opacity cursor-pointer"
        aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
          {isMuted && <line x1="3" y1="3" x2="21" y2="21" />}
        </svg>
      </button>

      {/* Bottom-left: CV link */}
      <a
        href={CV_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 left-3 z-[6] px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-md text-white/70 text-[11px] sm:text-xs font-medium tracking-wide hover:text-white hover:bg-white/20 transition-all cursor-pointer opacity-50 hover:opacity-100 no-underline"
      >
        CV
      </a>

      {/* Form (or any children) overlaid in the centre */}
      {children}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM5 14l.7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14z" />
    </svg>
  );
}
