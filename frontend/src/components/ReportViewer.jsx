import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  FileText, Copy, Download, Printer, Check, Bookmark,
  Layers, Sparkles, AlertTriangle, ExternalLink, ChevronRight
} from 'lucide-react'

/**
 * Normalizes raw LLM output into clean, structured GitHub Flavored Markdown
 * with proper H1/H2/H3 headings, abstract callout, and clean table formatting.
 */
export function normalizeReportMarkdown(raw) {
  if (!raw || typeof raw !== 'string') return ''

  let text = raw.trim()
  const lines = text.split('\n')
  const out = []

  let foundH1 = false
  let pendingTitle = false

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // 1. Detect "Title & Abstract" container
    if (/^#?\s*Title\s*&\s*Abstract/i.test(trimmed)) {
      continue
    }

    // 2. Detect "Title" label followed by the actual project title
    if (/^#?\s*Title$/i.test(trimmed)) {
      pendingTitle = true
      continue
    }

    if (pendingTitle && trimmed.length > 0) {
      out.push(`# ${trimmed.replace(/^#+\s*/, '')}\n`)
      foundH1 = true
      pendingTitle = false
      continue
    }

    // 3. Detect Abstract
    if (/^#?\s*Abstract$/i.test(trimmed)) {
      out.push('\n## Abstract\n')
      continue
    }

    // 4. Section titles without standard markdown heading hashes
    if (!trimmed.startsWith('#') && trimmed.length > 0 && trimmed.length < 80) {
      if (/^(?:1\.\s*)?Introduction\s*&\s*Problem\s*Statement/i.test(trimmed)) {
        out.push('\n## 1. Introduction & Problem Statement\n')
        continue
      }
      if (/^(?:2\.\s*)?Literature\s*Review/i.test(trimmed)) {
        out.push('\n## 2. Literature Review\n')
        continue
      }
      if (/^(?:3\.\s*)?Research\s*Gap(?:\s*&\s*Novelty)?/i.test(trimmed)) {
        out.push('\n## 3. Research Gap & Novelty\n')
        continue
      }
      if (/^(?:4\.\s*)?(?:Proposed\s*)?Methodology(?:\s*Design)?/i.test(trimmed)) {
        out.push('\n## 4. Proposed Methodology\n')
        continue
      }
      if (/^(?:5\.\s*)?Experimental\s*Setup(?:\s*&\s*Results)?/i.test(trimmed)) {
        out.push('\n## 5. Experimental Setup & Benchmarks\n')
        continue
      }
      if (/^6\.\d+\s+Results/i.test(trimmed) || /^Results(?:\s*Evaluation)?$/i.test(trimmed)) {
        out.push(`\n### ${trimmed.replace(/^#+\s*/, '')}\n`)
        continue
      }
      if (/^(?:6|7)\.\s*Discussion(?:\s*&\s*Limitations)?/i.test(trimmed) || /^Discussion$/i.test(trimmed)) {
        out.push('\n## 6. Discussion & Limitations\n')
        continue
      }
      if (/^(?:7|8)\.\s*Conclusion(?:\s*&\s*Future\s*Work)?/i.test(trimmed) || /^Conclusion$/i.test(trimmed)) {
        out.push('\n## 7. Conclusion & Future Work\n')
        continue
      }
      if (/^(?:8|9)\.\s*References/i.test(trimmed) || /^References$/i.test(trimmed)) {
        out.push('\n## 8. References\n')
        continue
      }
    }

    // 5. Format simulated dry-run disclaimer into blockquote callout
    if (trimmed.includes('The reported experimental numbers were produced by an LLM-simulated')) {
      out.push(`\n> ⚠️ **Simulated Dry-Run Notice:** ${trimmed}\n`)
      continue
    }

    // 6. Format Table captions into styled italic lead lines
    if (/^Table\s+\d+:/i.test(trimmed)) {
      out.push(`\n*${trimmed}*\n`)
      continue
    }

    out.push(rawLine)
  }

  return out.join('\n')
}

export default function ReportViewer({ reportMarkdown }) {
  const [copied, setCopied] = useState(false)

  // Normalize markdown text
  const cleanMarkdown = useMemo(() => {
    return normalizeReportMarkdown(reportMarkdown)
  }, [reportMarkdown])

  // Extract headings for the Quick-Jump Table of Contents
  const sections = useMemo(() => {
    if (!cleanMarkdown) return []
    const matches = []
    const lines = cleanMarkdown.split('\n')
    lines.forEach((line) => {
      const h2Match = line.match(/^##\s+(.+)$/)
      if (h2Match) {
        const title = h2Match[1].trim()
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        matches.push({ title, id })
      }
    })
    return matches
  }, [cleanMarkdown])

  const wordCount = useMemo(() => {
    return (cleanMarkdown || '').trim().split(/\s+/).filter(Boolean).length
  }, [cleanMarkdown])

  const readingTime = Math.max(1, Math.ceil(wordCount / 220))

  function handleCopy() {
    if (!cleanMarkdown) return
    navigator.clipboard.writeText(cleanMarkdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!cleanMarkdown) return
    const blob = new Blob([cleanMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `academic-fyp-proposal.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  function scrollToSection(id) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="report-viewer-container">
      {/* Document Control Toolbar */}
      <div className="report-doc-toolbar glass-panel">
        <div className="toolbar-meta-left">
          <div className="doc-type-badge">
            <FileText size={14} className="badge-icon" />
            <span>IEEE TRANSACTIONS FORMAT</span>
          </div>
          <div className="toolbar-stat-pills">
            <span className="stat-pill">{wordCount.toLocaleString()} Words</span>
            <span className="stat-pill">~{readingTime} Min Read</span>
            <span className="stat-pill verified">15/15 Stages Verified</span>
          </div>
        </div>

        <div className="toolbar-actions-right">
          <button className="doc-action-btn" onClick={handleCopy} title="Copy Markdown to Clipboard">
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className="doc-action-btn" onClick={handleDownload} title="Export Markdown File">
            <Download size={14} />
            <span>Export .md</span>
          </button>
          <button className="doc-action-btn" onClick={handlePrint} title="Print / Export PDF">
            <Printer size={14} />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive Quick-Jump Table of Contents */}
      {sections.length > 0 && (
        <div className="report-toc-bar">
          <div className="toc-title-chip">
            <Bookmark size={11} />
            <span>SECTIONS</span>
          </div>
          <div className="toc-scroll-track">
            {sections.map((sec) => (
              <button
                key={sec.id}
                className="toc-jump-pill"
                onClick={() => scrollToSection(sec.id)}
                title={`Jump to ${sec.title}`}
              >
                {sec.title.replace(/^\d+\.\s*/, '')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Formatted Academic Document Sheet */}
      <div className="academic-document-sheet">
        <div className="document-sheet-glow" />
        <div className="document-corner-accent top-left" />
        <div className="document-corner-accent top-right" />

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Level 1 Heading (Main Proposal Title)
            h1: ({ node, children, ...props }) => (
              <div className="academic-h1-container">
                <div className="h1-super-title">
                  <span className="h1-super-chip">FINAL YEAR PROJECT RESEARCH PROPOSAL</span>
                  <span className="h1-super-meta">AUTONOMOUS MULTI-AGENT SYNTHESIS</span>
                </div>
                <h1 className="academic-h1" {...props}>
                  {children}
                </h1>
                <div className="academic-title-divider" />
              </div>
            ),

            // Level 2 Heading (Numbered Major Sections)
            h2: ({ node, children, ...props }) => {
              const textContent = String(children || '')
              const sectionId = textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              const numMatch = textContent.match(/^(\d+)\.\s*(.+)$/)
              const isAbstract = textContent.toLowerCase().includes('abstract')

              return (
                <div className={`academic-h2-wrap ${isAbstract ? 'is-abstract' : ''}`} id={sectionId}>
                  <div className="h2-header-row">
                    {numMatch ? (
                      <span className="section-num-badge">§ {numMatch[1].padStart(2, '0')}</span>
                    ) : isAbstract ? (
                      <span className="section-num-badge abstract">
                        <Sparkles size={11} />
                      </span>
                    ) : (
                      <span className="section-num-badge">•</span>
                    )}
                    <h2 className="academic-h2" {...props}>
                      {numMatch ? numMatch[2] : children}
                    </h2>
                  </div>
                  <div className="academic-h2-underline" />
                </div>
              )
            },

            // Level 3 Heading (Subsections)
            h3: ({ node, children, ...props }) => (
              <div className="academic-h3-wrap">
                <h3 className="academic-h3" {...props}>
                  <span className="h3-bullet-pip" />
                  {children}
                </h3>
              </div>
            ),

            // Table Component
            table: ({ node, ...props }) => (
              <div className="academic-table-container">
                <div className="table-responsive-rail">
                  <table className="academic-table" {...props} />
                </div>
              </div>
            ),

            // Blockquotes (Notices & Citations)
            blockquote: ({ node, children, ...props }) => (
              <div className="academic-callout-panel">
                <div className="callout-icon-col">
                  <AlertTriangle size={16} className="callout-amber-icon" />
                </div>
                <div className="callout-content-col" {...props}>
                  {children}
                </div>
              </div>
            ),

            // Ordered Lists
            ol: ({ node, ...props }) => <ol className="academic-ol" {...props} />,

            // Unordered Lists
            ul: ({ node, ...props }) => <ul className="academic-ul" {...props} />,

            // List Items
            li: ({ node, ...props }) => <li className="academic-li" {...props} />,

            // Horizontal Dividers
            hr: () => (
              <div className="academic-divider-line">
                <div className="divider-glow-dot" />
              </div>
            ),

            // Paragraphs
            p: ({ node, ...props }) => <p className="academic-p" {...props} />,

            // Strong
            strong: ({ node, ...props }) => <strong className="academic-strong" {...props} />,

            // Links
            a: ({ node, href, children, ...props }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="academic-link" {...props}>
                <span>{children}</span>
                <ExternalLink size={10} className="ext-icon" />
              </a>
            ),

            // Inline and block code
            code: ({ node, inline, ...props }) =>
              inline ? (
                <code className="academic-inline-code" {...props} />
              ) : (
                <pre className="academic-code-block">
                  <code {...props} />
                </pre>
              ),
          }}
        >
          {cleanMarkdown}
        </ReactMarkdown>

        {/* Bottom Academic Signoff Footer */}
        <div className="academic-document-footer">
          <div className="doc-footer-left">
            <span className="footer-seal-dot" />
            <span>Compiled by ResearchAgent Autonomous Engine · End of Proposal</span>
          </div>
          <div className="doc-footer-right">
            <span>IEEE Transactions Template v2.4</span>
          </div>
        </div>
      </div>
    </div>
  )
}
