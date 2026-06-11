import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { X, PlayCircle, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&"'>]+)/);
  return match ? match[1] : null;
};

const ModuleViewer = ({ module, onClose, onPrev, onNext, hasPrev, hasNext, currentIndex, totalCount }) => {
  const contentRef = useRef(null);
  const ytId = getYouTubeId(module?.video_url);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!module) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/80 backdrop-blur-md overflow-y-auto p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-engine-panel border border-engine-neon/20 rounded-2xl shadow-[0_0_60px_rgba(var(--engine-neon-rgb),0.1)] my-8">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-engine-panel border-b border-engine-neon/10 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="w-5 h-5 text-engine-neon shrink-0" />
            <h2 className="text-white font-extrabold text-sm md:text-base uppercase tracking-widest truncate">{module.title}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {totalCount > 1 && (
              <span className="text-gray-500 text-xs font-mono">{currentIndex + 1} / {totalCount}</span>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Thumbnail */}
          {module.thumbnail_url && (
            <div className="w-full rounded-xl overflow-hidden border border-engine-neon/10 max-h-64 object-cover">
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${module.thumbnail_url}`}
                alt={module.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* YouTube Video */}
          {ytId && (
            <div className="relative w-full rounded-xl overflow-hidden border border-engine-neon/10" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}`}
                title={module.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Description */}
          {module.description && (
            <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-engine-neon/40 pl-4">{module.description}</p>
          )}

          {/* Rich Text Content */}
          {module.content_html && (
            <div
              ref={contentRef}
              className="prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed break-words overflow-hidden w-full
                [&_*]:max-w-full [&_*]:break-words
                [&_h1]:text-engine-neon [&_h1]:font-extrabold [&_h1]:uppercase [&_h1]:tracking-widest
                [&_h2]:text-white [&_h2]:font-bold
                [&_h3]:text-gray-300
                [&_strong]:text-white [&_strong]:font-bold
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                [&_blockquote]:border-l-2 [&_blockquote]:border-engine-neon/50 [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 [&_blockquote]:italic
                [&_code]:bg-engine-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-engine-neon [&_code]:text-xs [&_code]:font-mono
                [&_img]:rounded-xl [&_img]:border [&_img]:border-engine-neon/10 [&_img]:my-4 [&_img]:max-w-full [&_img]:h-auto
                [&_a]:text-engine-neon [&_a]:underline [&_a]:break-all
                [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-4 [&_iframe]:border [&_iframe]:border-engine-neon/10"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(module.content_html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }}
            />
          )}
        </div>

        {/* Footer Navigation */}
        {totalCount > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-engine-neon/10 rounded-b-2xl">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed text-engine-neon hover:bg-engine-neon/10 border border-transparent hover:border-engine-neon/30"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleViewer;
