import { Children, isValidElement, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from './CopyButton.jsx';

const remarkPlugins = [remarkGfm];

/** Plain text of a React node tree (used to copy a code block). */
function textOf(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf(node.props.children);
  return '';
}

/** Fenced code: a header with the language and a copy button, then a scrollable block. */
function CodeBlock({ node: _node, children, ...props }) {
  const code = Children.toArray(children).find(isValidElement);
  const language = /language-([\w+#-]+)/.exec(code?.props.className ?? '')?.[1];
  const text = textOf(code?.props.children).replace(/\n$/, '');
  return (
    <div className="overflow-hidden rounded-2xl border border-code-line bg-code font-sans shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-code-line py-1.5 pr-2 pl-4">
        <span className="flex items-center gap-2 font-label text-[11px] tracking-[0.1em] text-code-ink/60 uppercase">
          <span className="size-1.5 rounded-full bg-honey" aria-hidden="true" />{language ?? 'code'}
        </span>
        <CopyButton text={text} label="Copy code" tone="code" />
      </div>
      <pre {...props} className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-6 text-code-ink">
        {children}
      </pre>
    </div>
  );
}

const components = {
  pre: CodeBlock,
  // Wide tables scroll inside the message instead of stretching the thread.
  table: ({ node: _node, ...props }) => (
    <div className="markdown-table">
      <table {...props} />
    </div>
  ),
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

/**
 * Renders AI output as GitHub-flavored Markdown.
 * Raw HTML is not rendered, so model output can't inject markup or scripts.
 */
export const MarkdownMessage = memo(function MarkdownMessage({ content, streaming = false }) {
  return (
    <div className={`markdown ${streaming ? 'markdown-streaming' : ''}`}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>{content}</ReactMarkdown>
    </div>
  );
});
