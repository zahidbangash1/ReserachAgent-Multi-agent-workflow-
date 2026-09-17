import { useState } from 'react'
import {
  SearchCode, Check, X, ExternalLink, UserCheck, BookOpen,
  Sparkles, CheckSquare, Square, ArrowRight, ShieldCheck
} from 'lucide-react'

const GAP_FEEDBACK_PRESETS = [
  'Prioritize empirical dataset scarcity gaps over theoretical ones',
  'Target compute efficiency and inference latency bottlenecks',
  'Focus on real-world clinical validation challenges',
  'Synthesize gaps that can be benchmarked on open datasets',
]

export default function GapApproval({ payload, onResume, loading }) {
  const gaps = payload.gaps || []
  const papers = payload.papers || []
  const [selected, setSelected] = useState(gaps.map((_, i) => i))
  const [feedback, setFeedback] = useState('')

  function findPaperUrl(title) {
    const match = papers.find((p) => p.title === title)
    return match?.url || null
  }

  function toggle(idx) {
    setSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]))
  }

  function selectAll() {
    setSelected(gaps.map((_, i) => i))
  }

  function clearAll() {
    setSelected([])
  }

  return (
    <div className="panel glass-panel review-panel">
      {/* State-Based Header Pill */}
      <div className="checkpoint-banner amber">
        <div className="checkpoint-left">
          <div className="checkpoint-badge-icon">
            <UserCheck size={16} />
          </div>
          <div>
            <div className="checkpoint-badge-title">HUMAN-IN-THE-LOOP CHECKPOINT: GAP VERIFICATION</div>
            <div className="checkpoint-badge-sub">Literature Review Agent mined {gaps.length} empirical research opportunities</div>
          </div>
        </div>
        <span className="attempt-badge">Iteration #{payload.attempt}</span>
      </div>

      <div className="panel-title-group">
        <div className="title-and-batch-row">
          <div>
            <h2 className="panel-title">Validate Academic Literature Gaps</h2>
            <p className="panel-subtitle">
              The agent extracted these unaddressed research gaps directly from verified papers.
              Select which gaps your FYP will specifically bridge in its methodology.
            </p>
          </div>

          <div className="batch-selection-actions">
            <button type="button" className="batch-btn" onClick={selectAll} disabled={selected.length === gaps.length}>
              <CheckSquare size={12} />
              <span>Select All</span>
            </button>
            <button type="button" className="batch-btn" onClick={clearAll} disabled={selected.length === 0}>
              <Square size={12} />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      <div className="ideas-grid">
        {gaps.map((gap, idx) => {
          const isSelected = selected.includes(idx)

          return (
            <div
              key={idx}
              className={`idea-card glass-card gap-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggle(idx)}
            >
              <div className="card-select-radio">
                <div className={`selection-indicator ${isSelected ? 'active' : ''}`}>
                  {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                </div>
              </div>

              <div className="card-body">
                <div className="card-top-row">
                  <div className="candidate-meta-left">
                    <span className="candidate-num-pill">RESEARCH GAP 0{idx + 1}</span>
                    <span className="gap-novelty-pill">
                      <Sparkles size={11} />
                      <span>Empirical White-Space</span>
                    </span>
                  </div>

                  <span className="gap-status-tag">
                    {isSelected ? 'SELECTED FOR PROPOSAL' : 'EXCLUDED'}
                  </span>
                </div>

                <h3 className="card-title gap-title">{gap.description}</h3>

                {/* Novelty Justification */}
                <div className="card-justification-box">
                  <div className="box-lead">
                    <ShieldCheck size={12} className="sparkle-accent" />
                    <strong>NOVELTY JUSTIFICATION:</strong>
                  </div>
                  <p className="justification-text">{gap.novelty_justification}</p>
                </div>

                {/* Grounding in Peer Papers */}
                <div className="supporting-papers-box">
                  <div className="box-label">
                    <BookOpen size={11} />
                    <span>GROUNDED IN PEER PAPERS:</span>
                  </div>

                  {(gap.supporting_papers || []).length === 0 ? (
                    <span className="none-listed">Synthesized from primary search domain literature</span>
                  ) : (
                    <div className="paper-links-wrap">
                      {(gap.supporting_papers || []).map((title, i) => {
                        const url = findPaperUrl(title)
                        return url ? (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paper-pill-link"
                            onClick={(e) => e.stopPropagation()}
                            title="Open verified paper source"
                          >
                            <span>{title.length > 52 ? title.slice(0, 52) + '…' : title}</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span key={i} className="paper-pill-text">
                            {title.length > 52 ? title.slice(0, 52) + '…' : title}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Footer */}
      <div className="actions-glass-footer">
        <button
          type="button"
          className="btn-approve-emerald"
          disabled={loading || selected.length === 0}
          onClick={() => onResume({ approved: true, selected_gap_indices: selected })}
        >
          <Check size={16} />
          <span>Approve {selected.length} Gap{selected.length === 1 ? '' : 's'} & Synthesize Proposal</span>
          <ArrowRight size={14} style={{ marginLeft: 4 }} />
        </button>

        <div className="reject-section">
          <div className="preset-feedback-chips">
            <span className="presets-hint">QUICK STEER:</span>
            {GAP_FEEDBACK_PRESETS.map((preset, i) => (
              <button
                key={i}
                type="button"
                className="steer-chip"
                onClick={() => setFeedback(preset)}
                disabled={loading}
              >
                <span>{preset}</span>
              </button>
            ))}
          </div>

          <div className="reject-container">
            <input
              className="feedback-input"
              placeholder="Feedback for different gaps (e.g. Focus on low-compute benchmarks)..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button
              type="button"
              className="btn-reject-crimson"
              disabled={loading}
              onClick={() => onResume({ approved: false, feedback })}
            >
              <X size={15} />
              <span>Request Re-Mined Gaps</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}