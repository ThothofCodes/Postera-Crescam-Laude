// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Rich Text Editor with live Markdown preview
import { useState, useRef, useCallback, useEffect } from 'react';
import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

// ── Toolbar Button ───────────────────────────────────────────────────────────
const ToolbarBtn = ({ label, title, onClick, active = false }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    style={{
      padding: '4px 8px',
      background: active ? 'rgba(238,97,0,0.2)' : 'transparent',
      color: active ? '#EE6100' : '#c0d8f0',
      border: `1px solid ${active ? '#EE610044' : 'rgba(36,74,68,0.3)'}`,
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      cursor: 'pointer',
      minWidth: 28,
      textAlign: 'center',
      transition: 'all 0.15s',
    }}
  >
    {label}
  </button>
);

// ── Markdown Preview ─────────────────────────────────────────────────────────
const MarkdownPreview = ({ content }) => {
  const html = content ? marked.parse(content) : '<p style="color:#4a6a8a">Nothing to preview</p>';

  return (
    <div
      style={{
        padding: '1rem',
        background: '#050d0a',
        border: '1px solid rgba(36,74,68,0.3)',
        borderRadius: 8,
        overflowY: 'auto',
        maxHeight: '100%',
        color: '#c0d8f0',
        fontSize: 14,
        lineHeight: 1.7,
      }}
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// ── Main Editor ──────────────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange, placeholder, minHeight = 300 }) {
  const textareaRef = useRef(null);
  const [previewMode, setPreviewMode] = useState('split'); // 'edit' | 'split' | 'preview'
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Track history for undo/redo
  useEffect(() => {
    if (value !== undefined && (history.length === 0 || history[history.length - 1] !== value)) {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), value].slice(-50));
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }
  }, [value]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      onChange(history[historyIndex - 1]);
    }
  }, [history, historyIndex, onChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      onChange(history[historyIndex + 1]);
    }
  }, [history, historyIndex, onChange]);

  // Insert text at cursor position
  const insertAtCursor = useCallback((before, after = '', defaultText = '') => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const text = selected || defaultText;
    const insertion = `${before}${text}${after}`;
    const newValue = value.substring(0, start) + insertion + value.substring(end);

    onChange(newValue);

    // Restore cursor position
    setTimeout(() => {
      ta.focus();
      if (selected) {
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + selected.length;
      } else {
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + defaultText.length;
      }
    }, 0);
  }, [value, onChange]);

  // Insert at line start
  const insertLinePrefix = useCallback((prefix) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);

    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length;
    }, 0);
  }, [value, onChange]);

  // Tab key support
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
    // Ctrl+Z / Ctrl+Y for undo/redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  };

  // Word/char count
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = value ? value.length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 8px',
        background: '#0a1a15',
        border: '1px solid rgba(36,74,68,0.3)',
        borderBottom: 'none',
        borderRadius: '8px 8px 0 0',
        flexWrap: 'wrap',
      }}>
        {/* Text formatting */}
        <div style={{ display: 'flex', gap: 2, borderRight: '1px solid rgba(36,74,68,0.3)', paddingRight: 6, marginRight: 4 }}>
          <ToolbarBtn label="B" title="Bold (Ctrl+B)" onClick={() => insertAtCursor('**', '**', 'bold text')} />
          <ToolbarBtn label="I" title="Italic (Ctrl+I)" onClick={() => insertAtCursor('_', '_', 'italic text')} />
          <ToolbarBtn label="S" title="Strikethrough" onClick={() => insertAtCursor('~~', '~~', 'strikethrough')} />
          <ToolbarBtn label="`" title="Inline code" onClick={() => insertAtCursor('`', '`', 'code')} />
        </div>

        {/* Headings */}
        <div style={{ display: 'flex', gap: 2, borderRight: '1px solid rgba(36,74,68,0.3)', paddingRight: 6, marginRight: 4 }}>
          <ToolbarBtn label="H1" title="Heading 1" onClick={() => insertLinePrefix('# ')} />
          <ToolbarBtn label="H2" title="Heading 2" onClick={() => insertLinePrefix('## ')} />
          <ToolbarBtn label="H3" title="Heading 3" onClick={() => insertLinePrefix('### ')} />
          <ToolbarBtn label="H4" title="Heading 4" onClick={() => insertLinePrefix('#### ')} />
        </div>

        {/* Lists */}
        <div style={{ display: 'flex', gap: 2, borderRight: '1px solid rgba(36,74,68,0.3)', paddingRight: 6, marginRight: 4 }}>
          <ToolbarBtn label="• " title="Bullet list" onClick={() => insertLinePrefix('- ')} />
          <ToolbarBtn label="1." title="Numbered list" onClick={() => insertLinePrefix('1. ')} />
          <ToolbarBtn label="☐" title="Task list" onClick={() => insertLinePrefix('- [ ] ')} />
        </div>

        {/* Block elements */}
        <div style={{ display: 'flex', gap: 2, borderRight: '1px solid rgba(36,74,68,0.3)', paddingRight: 6, marginRight: 4 }}>
          <ToolbarBtn label=">" title="Blockquote" onClick={() => insertLinePrefix('> ')} />
          <ToolbarBtn label="—" title="Horizontal rule" onClick={() => insertAtCursor('\n---\n')} />
          <ToolbarBtn label="{}" title="Code block" onClick={() => insertAtCursor('\n```\n', '\n```\n', 'code here')} />
        </div>

        {/* Links & Images */}
        <div style={{ display: 'flex', gap: 2, borderRight: '1px solid rgba(36,74,68,0.3)', paddingRight: 6, marginRight: 4 }}>
          <ToolbarBtn label="🔗" title="Insert link" onClick={() => insertAtCursor('[', '](https://url)', 'link text')} />
          <ToolbarBtn label="🖼" title="Insert image" onClick={() => insertAtCursor('![', '](https://image-url)', 'alt text')} />
          <ToolbarBtn label="📊" title="Insert table" onClick={() => insertAtCursor('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n')} />
        </div>

        {/* Undo/Redo */}
        <div style={{ display: 'flex', gap: 2, borderRight: '1px solid rgba(36,74,68,0.3)', paddingRight: 6, marginRight: 4 }}>
          <ToolbarBtn label="↶" title="Undo (Ctrl+Z)" onClick={undo} />
          <ToolbarBtn label="↷" title="Redo (Ctrl+Y)" onClick={redo} />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 2, background: '#0F2620', borderRadius: 4, padding: 2 }}>
          {[
            { key: 'edit', label: '✏️', title: 'Editor only' },
            { key: 'split', label: '⊟', title: 'Split view' },
            { key: 'preview', label: '👁', title: 'Preview only' },
          ].map(({ key, label, title }) => (
            <button
              key={key}
              type="button"
              title={title}
              onClick={() => setPreviewMode(key)}
              style={{
                padding: '3px 8px',
                background: previewMode === key ? '#EE6100' : 'transparent',
                color: previewMode === key ? '#000' : '#4a6a8a',
                border: 'none',
                borderRadius: 3,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{
        display: 'flex',
        gap: previewMode === 'split' ? 8 : 0,
        minHeight,
        border: '1px solid rgba(36,74,68,0.3)',
        borderTop: previewMode === 'split' ? '1px solid rgba(36,74,68,0.3)' : 'none',
        borderRadius: previewMode === 'split' ? '0 0 8px 8px' : '0 0 8px 8px',
        overflow: 'hidden',
      }}>
        {/* Textarea */}
        {previewMode !== 'preview' && (
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Write your article content here...\n\nSupports Markdown:\n# Heading 1\n## Heading 2\n**bold** _italic_\n- list item\n> blockquote\n```code block```'}
            style={{
              flex: previewMode === 'split' ? 1 : 'auto',
              width: previewMode === 'split' ? '50%' : '100%',
              padding: '1rem',
              background: '#0B1F1B',
              border: 'none',
              color: '#F4F1EA',
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              lineHeight: 1.7,
              resize: 'none',
              outline: 'none',
              tabSize: 2,
            }}
          />
        )}

        {/* Preview */}
        {previewMode !== 'edit' && (
          <div style={{
            flex: previewMode === 'split' ? 1 : 'auto',
            width: previewMode === 'split' ? '50%' : '100%',
            overflow: 'hidden',
            borderLeft: previewMode === 'split' ? '1px solid rgba(36,74,68,0.3)' : 'none',
          }}>
            <div style={{
              padding: '6px 12px',
              background: '#0a1a15',
              borderBottom: '1px solid rgba(36,74,68,0.3)',
              fontSize: 10,
              color: '#4a6a8a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}>
              Preview
            </div>
            <div style={{ height: `calc(100% - 28px)`, overflow: 'auto' }}>
              <MarkdownPreview content={value} />
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        background: '#0a1a15',
        border: '1px solid rgba(36,74,68,0.3)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        fontSize: 10,
        color: '#4a6a8a',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          <span>~{readTime} min read</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span>Markdown</span>
          <span style={{ color: '#2BB6A3' }}>●</span>
        </div>
      </div>

      {/* Markdown styles for preview */}
      <style>{`
        .markdown-preview h1 { font-size: 1.8em; font-weight: 800; color: #F4F1EA; margin: 1em 0 0.5em; border-bottom: 1px solid rgba(36,74,68,0.3); padding-bottom: 0.3em; }
        .markdown-preview h2 { font-size: 1.5em; font-weight: 700; color: #F4F1EA; margin: 1em 0 0.5em; border-bottom: 1px solid rgba(36,74,68,0.2); padding-bottom: 0.3em; }
        .markdown-preview h3 { font-size: 1.25em; font-weight: 700; color: #F4F1EA; margin: 1em 0 0.5em; }
        .markdown-preview h4 { font-size: 1.1em; font-weight: 600; color: #c0d8f0; margin: 1em 0 0.5em; }
        .markdown-preview p { margin: 0.75em 0; line-height: 1.7; }
        .markdown-preview strong { color: #F4F1EA; font-weight: 700; }
        .markdown-preview em { color: #c0d8f0; }
        .markdown-preview a { color: #2BB6A3; text-decoration: underline; }
        .markdown-preview a:hover { color: #EE6100; }
        .markdown-preview code { background: rgba(36,74,68,0.3); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; color: #EE6100; }
        .markdown-preview pre { background: #0a1a15; border: 1px solid rgba(36,74,68,0.3); border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1em 0; }
        .markdown-preview pre code { background: transparent; padding: 0; color: #c0d8f0; }
        .markdown-preview blockquote { border-left: 3px solid #EE6100; padding: 0.5em 1em; margin: 1em 0; background: rgba(238,97,0,0.05); color: #c0d8f0; }
        .markdown-preview ul, .markdown-preview ol { padding-left: 1.5em; margin: 0.75em 0; }
        .markdown-preview li { margin: 0.25em 0; line-height: 1.6; }
        .markdown-preview hr { border: none; border-top: 1px solid rgba(36,74,68,0.3); margin: 1.5em 0; }
        .markdown-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .markdown-preview th, .markdown-preview td { border: 1px solid rgba(36,74,68,0.3); padding: 8px 12px; text-align: left; }
        .markdown-preview th { background: #0a1a15; color: #F4F1EA; font-weight: 600; }
        .markdown-preview tr:nth-child(even) { background: rgba(36,74,68,0.1); }
        .markdown-preview img { max-width: 100%; border-radius: 8px; margin: 1em 0; }
        .markdown-preview input[type="checkbox"] { margin-right: 6px; accent-color: #EE6100; }
      `}</style>
    </div>
  );
}
