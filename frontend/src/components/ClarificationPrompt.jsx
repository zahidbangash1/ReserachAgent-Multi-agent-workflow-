import { useState } from 'react'
import { HelpCircle, ArrowRight, Sparkles, UserCheck } from 'lucide-react'

export default function ClarificationPrompt({ payload, onResume, loading }) {
  const [answer, setAnswer] = useState('')

  function handleKeyDown(e) {
    if (e.key === 'Enter' && answer.trim()) onResume(answer)
  }

  return (
    <div className="panel glass-panel review-panel">
      <div className="checkpoint-banner amber">
        <div className="checkpoint-left">
          <HelpCircle size={16} />
          <span>RESEARCH CLARIFICATION REQUIRED</span>
        </div>
      </div>

      <div className="panel-title-group">
        <h2 className="panel-title">Clarify Your Research Scope</h2>
        <p className="panel-subtitle" style={{ fontSize: '1rem', color: 'var(--text-bright)', marginTop: '0.6rem' }}>
          {payload.question}
        </p>
      </div>

      <div className="textarea-wrapper" style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response here and press Enter or Submit..."
          disabled={loading}
          autoFocus
        />
        <div className="textarea-glow-border" />
      </div>

      <div className="actions-glass-footer" style={{ borderTop: 'none', paddingTop: '0.5rem' }}>
        <button
          className="submit-agent-btn"
          disabled={loading || !answer.trim()}
          onClick={() => onResume(answer)}
        >
          <span>Continue Pipeline</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}