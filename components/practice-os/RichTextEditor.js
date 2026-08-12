'use client';

import { useRef, useEffect, useCallback } from 'react';

// A small rich-text notes editor: bold, underline, bullet + numbered lists, with
// automatic list continuation (contentEditable handles the numbering natively).
// Stores HTML in the note's `content` string — no backend change; list previews
// strip the tags. execCommand is deprecated but still the most reliable
// cross-browser way to do this without pulling in a heavy editor dependency. (#20)
//
// Props: value (HTML string), onChange(html), placeholder, className, style,
// resetKey (change it — e.g. the note id — to load fresh content without fighting
// the caret).
export default function RichTextEditor({ value, onChange, placeholder = 'Start writing…', className = '', style, resetKey }) {
  const ref = useRef(null);

  // Load initial/opened content only when the note changes, so typing never resets
  // the caret to the top.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const emit = useCallback(() => {
    if (!ref.current) return;
    let html = ref.current.innerHTML;
    if (html === '<br>' || html === '<div><br></div>') html = '';
    onChange(html);
  }, [onChange]);

  const cmd = useCallback((command) => {
    ref.current?.focus();
    document.execCommand(command, false);
    emit();
  }, [emit]);

  const isEmpty = !value || value === '<br>';

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <ToolbarBtn onClick={() => cmd('bold')} label="Bold"><span className="font-bold">B</span></ToolbarBtn>
        <ToolbarBtn onClick={() => cmd('underline')} label="Underline"><span className="underline">U</span></ToolbarBtn>
        <ToolbarBtn onClick={() => cmd('italic')} label="Italic"><span className="italic font-serif">I</span></ToolbarBtn>
        <span className="w-px h-4 mx-1" style={{ background: 'var(--rule)' }} />
        <ToolbarBtn onClick={() => cmd('insertUnorderedList')} label="Bullet list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => cmd('insertOrderedList')} label="Numbered list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 16H4c0-1 2-2 2-3s-1-1.5-2-1" /></svg>
        </ToolbarBtn>
      </div>
      <div className="relative">
        {isEmpty && (
          <p className="absolute top-0 left-0 pointer-events-none text-[var(--muted)]" style={{ padding: 'inherit' }}>{placeholder}</p>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          role="textbox"
          aria-multiline="true"
          className={`outline-none pos-richtext ${className}`}
          style={style}
        />
      </div>
      <style>{`
        .pos-richtext ul { list-style: disc; padding-left: 1.4em; margin: .3em 0; }
        .pos-richtext ol { list-style: decimal; padding-left: 1.5em; margin: .3em 0; }
        .pos-richtext li { margin: .15em 0; }
        .pos-richtext a { color: var(--green); text-decoration: underline; }
      `}</style>
    </div>
  );
}

function ToolbarBtn({ onClick, label, children }) {
  return (
    <button
      type="button"
      // preventDefault on mousedown keeps the text selection while the button is clicked.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-8 h-8 rounded-md flex items-center justify-center text-[13px] text-[var(--ink)] hover:bg-[var(--rule-soft)] transition-colors"
      style={{ border: '1px solid var(--rule)' }}
    >
      {children}
    </button>
  );
}
