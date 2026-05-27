import katex from 'katex'

/**
 * LatexText: Renders a string that mixes plain text and LaTeX math.
 *
 * Supports these delimiters:
 *   $$...$$    → block/display math
 *   \[...\]   → block/display math
 *   $...$      → inline math
 *   \(...\)   → inline math
 *
 * Plain text regions are rendered as <span> elements so they inherit
 * normal font styling. Math is rendered by KaTeX.
 */

// Match display math, inline math, asymptote code blocks, rendered diagram images (with optional leading whitespace), and \begin{} environments
const TOKEN_REGEX = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$]+?\$|\\\([^)]+?\\\)|\\begin\{[^}]+\}[\s\S]+?\\end\{[^}]+\}|\[asy\][\s\S]*?\[\/asy\]|\s*!\[.*?\]\(https?:\/\/[^)]+\))/g

function renderMath(raw) {
  const isDisplay = raw.startsWith('$$') || raw.startsWith('\\[')
  let inner = raw
  if (raw.startsWith('$$'))   inner = raw.slice(2, -2)
  else if (raw.startsWith('\\[')) inner = raw.slice(2, -2)
  else if (raw.startsWith('$'))   inner = raw.slice(1, -1)
  else if (raw.startsWith('\\(')) inner = raw.slice(2, -2)

  try {
    return katex.renderToString(inner.trim(), {
      displayMode: isDisplay,
      throwOnError: true,
      strict: false,
    })
  } catch (e) {
    return `<span style="color:inherit">${raw}</span>`
  }
}

export default function LatexText({ text, className = '' }) {
  if (!text) return null

  // Fast check for delimiter-less legacy DB equations
  let tempText = text
  const hasDelimiters = /(\$\$|\\\[|\$|\\\()/g.test(tempText)
  if (!hasDelimiters && tempText.includes('\\')) {
    try {
      const html = katex.renderToString(tempText.trim(), { displayMode: true, throwOnError: true, strict: false })
      return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
    } catch {
      // ignore
    }
  }

  const parts = tempText.split(TOKEN_REGEX)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!part) return null
        
        if (part.startsWith('[asy]')) {
          const code = part.replace(/^\[asy\]/, '').replace(/\[\/asy\]$/, '').trim()
          return (
            <details key={i} className="asy-details" style={{ margin: '1rem 0', padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#6366f1' }}>View Geometry Coordinates</summary>
              <pre style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap', fontSize: '0.75rem', fontFamily: 'monospace', color: '#555' }}>
                {code}
              </pre>
            </details>
          )
        }

        // Rendered diagram image from the pre-rendering pipeline
        if (part.startsWith('![') || /^\s*!\[/.test(part)) {
          const matchImg = part.trim().match(/^!\[(.*?)\]\((https?:\/\/[^)]+)\)$/)
          if (matchImg) {
            const [, alt, url] = matchImg
            return (
              <span key={i} style={{ display: 'block', textAlign: 'center', margin: '1rem 0' }}>
                <img
                  src={url.trim()}
                  alt={alt || 'Geometry Diagram'}
                  style={{ maxWidth: '100%', maxHeight: '340px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </span>
            )
          }
        }

        if (part.startsWith('$') || part.startsWith('\\(') || part.startsWith('\\[')) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderMath(part) }}
            />
          )
        }

        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
