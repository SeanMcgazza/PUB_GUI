'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function BlogContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold text-warm-brown mt-10 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold text-warm-brown mt-8 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold text-warm-brown mt-6 mb-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-semibold text-warm-brown mt-4 mb-2">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="text-base leading-7 text-foreground mb-4">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-gold hover:text-gold-dark underline underline-offset-2 transition-colors"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-1 text-foreground">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-1 text-foreground">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-7">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gold pl-4 py-1 my-6 italic text-muted-foreground bg-gold/5 rounded-r-lg">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className={`${className} block bg-warm-brown text-cream p-4 rounded-xl text-sm overflow-x-auto my-4`}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-warm-brown">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-warm-brown text-cream p-4 rounded-xl text-sm overflow-x-auto my-6">
            {children}
          </pre>
        ),
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="rounded-xl shadow-soft my-6 w-full h-auto"
          />
        ),
        hr: () => <hr className="border-border my-8" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="w-full border-collapse border border-border rounded-xl">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-4 py-2 text-left text-sm font-semibold text-warm-brown">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-4 py-2 text-sm">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
