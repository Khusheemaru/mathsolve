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

const MATH_REGEX = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]+?\\\))/g

function renderMath(raw) {
  // Determine if display mode
  const isDisplay = raw.startsWith('$$') || raw.startsWith('\\[')
  // Strip delimiters
  let inner = raw
  if (raw.startsWith('$$'))   inner = raw.slice(2, -2)
  else if (raw.startsWith('\\[')) inner = raw.slice(2, -2)
  else if (raw.startsWith('$'))   inner = raw.slice(1, -1)
  else if (raw.startsWith('\\(')) inner = raw.slice(2, -2)

  try {
    return katex.renderToString(inner.trim(), {
      displayMode: isDisplay,
      throwOnError: false,
      strict: false,
    })
  } catch {
    return `<span style="color:inherit">${raw}</span>`
  }
}

export default function LatexText({ text, className = '' }) {
  if (!text) return null

  const parts = text.split(MATH_REGEX)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (MATH_REGEX.test(part)) {
          MATH_REGEX.lastIndex = 0 // reset stateful regex
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderMath(part) }}
            />
          )
        }
        MATH_REGEX.lastIndex = 0
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
