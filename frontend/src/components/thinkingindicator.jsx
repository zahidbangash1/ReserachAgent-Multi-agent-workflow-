import { useEffect, useState } from 'react'
import { Cpu, Sparkles, Compass, Radio } from 'lucide-react'
import { FALLBACK_HINTS } from '../pipelineStages'

export default function ThinkingIndicator({ liveLabel = null }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (liveLabel) return
    setIndex(0)
    const interval = setInterval(() => setIndex((i) => (i + 1) % FALLBACK_HINTS.length), 2200)
    return () => clearInterval(interval)
  }, [liveLabel])

  const displayText = liveLabel || FALLBACK_HINTS[index]

  return (
    <div className="thinking-processor-card">
      <div className="thinking-glass-glow" />

      <div className="thinking-layout">
        {/* Animated Cybernetic Orbital Rings */}
        <div className="orbital-spinner-wrap">
          <div className="orbital-ring ring-outer" />
          <div className="orbital-ring ring-mid" />
          <div className="orbital-center-core">
            <Cpu size={16} className="core-icon" />
          </div>
        </div>

        {/* Content & Status Matrix */}
        <div className="thinking-body">
          <div className="thinking-header-line">
            <span className="live-engine-tag">
              <span className="pulsing-beacon" />
              COGNITIVE PIPELINE ACTIVE
            </span>
            <span className="thinking-subtag">LangGraph State Machine</span>
          </div>

          <div className="thinking-text-stream">
            <span className="stream-text">{displayText}</span>
            <span className="blinking-caret">▍</span>
          </div>

          <div className="thinking-footer-bar">
            <span className="micro-status">
              <Radio size={11} className="spin-slow" />
              Querying neural memory & verified citations...
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}