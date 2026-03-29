'use client';

const SECTIONS = ['Objective', 'Skills', 'Certifications', 'Applied Skills', 'Projects'];

export default function IdleOverlay({ visible, onSectionClick }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-[5] pointer-events-none transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center -mt-4 flex flex-col items-center">
        <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-lg">
          Miguel Lacanienta
        </h1>
        <p className="text-white/80 text-sm sm:text-base font-light mt-1.5 tracking-wide drop-shadow-md">
          BS Computer Science · AI Specialization · Mapúa University &apos;25
        </p>
        <div className={`mt-2 flex items-center gap-1.5 ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {SECTIONS.map((section) => (
            <button
              key={section}
              onClick={() => onSectionClick?.(section)}
              className="px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-md text-[11px] sm:text-xs font-medium tracking-wide transition-all cursor-pointer text-white/70 hover:text-white hover:bg-white/20"
            >
              {section}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
