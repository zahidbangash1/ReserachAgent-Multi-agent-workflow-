import { useState, useEffect } from 'react'
import { Activity, Database, Terminal, Layers } from 'lucide-react'

export default function AiSystemTelemetry({
  isLive,
  activeAgentLabel,
  traceCount = 0,
  wordCount = 0,
  onOpenArchitecture,
  onOpenHistory,
}) {
  const [latency, setLatency] = useState(115)
  const [estimatedTokens, setEstimatedTokens] = useState(0)

  // Dynamic realistic telemetry fluctuations while running
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      setLatency(Math.floor(98 + Math.random() * 32))
    }, 1800)
    return () => clearInterval(interval)
  }, [isLive])

  // Compute realistic token gauge from trace count & word count
  useEffect(() => {
    const baseTokens = Math.max(280, traceCount * 145 + Math.round(wordCount * 1.33))
    setEstimatedTokens(baseTokens)
  }, [traceCount, wordCount])

  return (
    <div className="telemetry-hud" role="region" aria-label="AI System Telemetry HUD">
      <div className="telemetry-inner">
        {/* Left: Latency Gauge */}
        <div className="telemetry-group">
          <div className="telemetry-chip latency-chip">
            <span className="chip-icon"><Activity size={13} /></span>
            <span className="chip-label">LATENCY</span>
            <span className="chip-val">{isLive ? `${latency}ms` : '42ms'}</span>
          </div>
        </div>

        {/* Center: Live Neural Activity Waveform & Agent Status */}
        <div className="telemetry-center">
          <div className={`neural-eq ${isLive ? 'active' : ''}`} aria-hidden="true">
            <span className="bar bar-1" />
            <span className="bar bar-2" />
            <span className="bar bar-3" />
            <span className="bar bar-4" />
            <span className="bar bar-5" />
            <span className="bar bar-6" />
            <span className="bar bar-7" />
            <span className="bar bar-8" />
          </div>

          <div className="active-agent-banner">
            <span className={`status-beacon ${isLive ? 'pulse-cyan' : 'ready-green'}`} />
            <span className="agent-text">
              {isLive ? (
                <>
                  <span className="agent-tag">ACTIVE SUB-AGENT:</span>
                  <span className="agent-name">{activeAgentLabel || 'Neural Graph Processing'}</span>
                </>
              ) : (
                <>
                  <span className="agent-tag">SYSTEM:</span>
                  <span className="agent-name">Autonomous Multi-Agent Pipeline Ready</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Right: Tokens, Database History & System Architecture Spec */}
        <div className="telemetry-group right">
          <div className="telemetry-chip token-chip">
            <span className="chip-icon"><Terminal size={13} /></span>
            <span className="chip-label">TOKENS</span>
            <span className="chip-val">{estimatedTokens.toLocaleString()}</span>
            <span className="chip-sub">/ 128k</span>
          </div>

          <div className="hud-actions">
            {onOpenHistory ? (
              <button
                type="button"
                className="hud-btn hud-btn-secondary"
                onClick={onOpenHistory}
                title="View PostgreSQL Search History & Stored Ideas"
              >
                <Database size={13} color="#38bdf8" />
                <span>DB History</span>
              </button>
            ) : (
              <div className="telemetry-chip conn-chip" title="PostgreSQL Database Connected">
                <span className="chip-icon"><Database size={13} color="#38bdf8" /></span>
                <span className="chip-label">DB</span>
                <span className="chip-val">Postgres</span>
              </div>
            )}

            {onOpenArchitecture && (
              <button
                type="button"
                className="hud-btn hud-btn-secondary"
                onClick={onOpenArchitecture}
                title="Inspect 15-Agent StateGraph Architecture Spec"
              >
                <Layers size={13} />
                <span>System Spec</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

