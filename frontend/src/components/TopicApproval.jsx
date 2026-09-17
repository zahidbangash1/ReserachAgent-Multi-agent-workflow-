import { useState } from 'react'
import {
  Lightbulb, Check, X, ShieldAlert, Sparkles, UserCheck,
  AlertCircle, Edit3, CheckCircle2, ChevronRight, Gauge, ArrowRight
} from 'lucide-react'

function feasibilityTier(score) {
  if (score >= 8) return { cls: 'high', label: 'High Feasibility', color: '#10b981', risk: 'Low Execution Risk' }
  if (score >= 5) return { cls: 'mid', label: 'Moderate Feasibility', color: '#06b6d4', risk: 'Standard Complexity' }
  return { cls: 'low', label: 'Ambitious Target', color: '#f59e0b', risk: 'High Research Risk' }
}

const FEEDBACK_PRESETS = [
  'Focus on low-compute benchmarks suitable for edge hardware',
  'Pivot towards healthcare or medical clinical NLP datasets',
  'Incorporate multimodal vision-language representations',
  'Ensure accessibility of open-source training data',
]

export default function TopicApproval({ payload, onResume, loading }) {
  const ideas = payload.ideas || []
  const [selectedId, setSelectedId] = useState(ideas[0]?.id ?? null)
  const [feedback, setFeedback] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [customTitles, setCustomTitles] = useState({})

  function handleTitleChange(id, newTitle) {
    setCustomTitles((prev) => ({ ...prev, [id]: newTitle }))
  }

  function handleApprove() {
    const chosenIdea = ideas.find((i) => i.id === selectedId)
    const finalTitle = customTitles[selectedId] || chosenIdea?.title
    onResume({
      approved: true,
      selected_idea_id: selectedId,
      custom_title: finalTitle !== chosenIdea?.title ? finalTitle : undefined,
    })
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
            <div className="checkpoint-badge-title">HUMAN-IN-THE-LOOP CHECKPOINT: TOPIC SELECTION</div>
            <div className="checkpoint-badge-sub">Autonomous Ideation Agent synthesized {ideas.length} candidate directions</div>
          </div>
        </div>
        <span className="attempt-badge">Iteration #{payload.attempt}</span>
      </div>

      <div className="panel-title-group">
        <h2 className="panel-title">Select or Refine Candidate Research Topic</h2>
        <p className="panel-subtitle">
          The ideation agent evaluated literature viability, academic novelty, and undergraduate scope constraints.
          Select the proposal direction you want to advance through literature review, or request a steered re-ideation.
        </p>
      </div>

      <div className="ideas-grid">
        {ideas.map((idea, idx) => {
          const tier = feasibilityTier(idea.feasibility_score)
          const isSelected = selectedId === idea.id
          const currentTitle = customTitles[idea.id] ?? idea.title
          const isEditing = editingId === idea.id

          return (
            <div
              key={idea.id}
              className={`idea-card glass-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedId(idea.id)}
            >
              <div className="card-select-radio">
                <div className={`selection-indicator ${isSelected ? 'active' : ''}`}>
                  {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                </div>
              </div>

              <div className="card-body">
                <div className="card-top-row">
                  <div className="candidate-meta-left">
                    <span className="candidate-num-pill">CANDIDATE 0{idx + 1}</span>
                    <span className="card-domain-tag">
                      <Sparkles size={11} />
                      <span>{idea.domain}</span>
                    </span>
                  </div>

                  <div className="candidate-meta-right">
                    <span className={`feasibility-badge ${tier.cls}`} style={{ borderColor: `${tier.color}40`, color: tier.color }}>
                      <Gauge size={11} />
                      <span>{tier.label} ({idea.feasibility_score}/10)</span>
                    </span>
                  </div>
                </div>

                {/* Title & In-Place Editing */}
                <div className="card-title-container">
                  {isEditing ? (
                    <div className="inline-title-edit" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        className="inline-title-input"
                        value={currentTitle}
                        onChange={(e) => handleTitleChange(idea.id, e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="save-edit-btn"
                        onClick={() => setEditingId(null)}
                      >
                        <Check size={13} />
                        <span>Done</span>
                      </button>
                    </div>
                  ) : (
                    <div className="title-display-row">
                      <h3 className="card-title">{currentTitle}</h3>
                      <button
                        type="button"
                        className="edit-topic-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(idea.id)
                        }}
                        title="Customize topic wording"
                      >
                        <Edit3 size={12} />
                        <span>Tweak</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Feasibility Progress Bar */}
                <div className="feasibility-meter-wrap">
                  <div className="meter-label-row">
                    <span className="meter-label">Feasibility Benchmark</span>
                    <span className="meter-risk">{tier.risk}</span>
                  </div>
                  <div className="gauge-track">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${idea.feasibility_score * 10}%`,
                        background: `linear-gradient(90deg, ${tier.color}77, ${tier.color})`,
                        boxShadow: `0 0 10px ${tier.color}55`,
                      }}
                    />
                  </div>
                </div>

                {/* Core Problem Statement */}
                <div className="card-problem-text">
                  <span className="problem-label">CORE CHALLENGE:</span>
                  <span className="problem-content">{idea.core_problem}</span>
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
          disabled={loading || !selectedId}
          onClick={handleApprove}
        >
          <Check size={16} />
          <span>Approve & Launch Literature Scan</span>
          <ArrowRight size={14} style={{ marginLeft: 4 }} />
        </button>

        <div className="reject-section">
          <div className="preset-feedback-chips">
            <span className="presets-hint">QUICK STEER:</span>
            {FEEDBACK_PRESETS.map((preset, i) => (
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
              placeholder="Feedback for re-ideation (e.g. Focus on low-compute benchmarks)..."
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
              <span>Request New Batch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}