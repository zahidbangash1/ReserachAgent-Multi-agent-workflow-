import { useRef, useEffect, useState } from 'react'
import {
  Check, Loader2, UserCheck, ChevronDown, ChevronRight,
  Activity, Shield, Clock, Cpu, ArrowRight
} from 'lucide-react'
import { DISPLAY_STAGES, currentStageIndex, stageProgress } from '../lib/stages'

const RING_CIRC = 2 * Math.PI * 24 // r=24, circ ≈ 150.8

// Group stages by phaseId
const PHASES = [
  { id: 'phase-1', title: 'Phase 01 · Inception & Scoping', short: 'PHASE 01' },
  { id: 'phase-2', title: 'Phase 02 · Literature & Rigor', short: 'PHASE 02' },
  { id: 'phase-3', title: 'Phase 03 · Architecture & Feasibility', short: 'PHASE 03' },
  { id: 'phase-4', title: 'Phase 04 · Empirical & Synthesis', short: 'PHASE 04' },
]

export default function PipelineTracker({ trace, isLive, interrupt }) {
  const activeIdx = currentStageIndex(trace)
  const pct = Math.round(stageProgress(trace) * 100)
  const dashOffset = RING_CIRC - (RING_CIRC * pct) / 100
  const activeNodeRef = useRef(null)
  const [expandedStage, setExpandedStage] = useState(null)

  const activeStage = activeIdx >= 0 ? DISPLAY_STAGES[activeIdx] : null
  const isAwaitingHuman = Boolean(interrupt) || (activeStage?.isHuman && !isLive && pct < 100 && activeIdx >= 0)

  const ringLabel =
    activeIdx === -1
      ? 'System Standby'
      : pct >= 100
      ? 'Mission Completed'
      : activeStage?.label ?? ''

  const doneCount = activeIdx === -1 ? 0 : pct >= 100 ? DISPLAY_STAGES.length : activeIdx

  // Automatically scroll active agent node into view smoothly
  useEffect(() => {
    if (activeIdx >= 0 && activeNodeRef.current) {
      activeNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeIdx])

  // Determine current active phase
  const currentPhaseTitle = activeStage
    ? activeStage.phaseTitle
    : pct >= 100
    ? 'All Phases Complete'
    : 'Phase 01 · Inception & Scoping'

  return (
    <div className="pipeline-widget">
      {/* High-Tech Aerospace Cockpit Progress Gauge Card */}
      <div className="sci-fi-gauge-card">
        <div className="gauge-glow-ambient" />
        <div className="gauge-grid-overlay" />

        <div className="gauge-flex-row">
          {/* Radial HUD Dial with Degree Ticks */}
          <div className="gauge-dial-wrap">
            <svg viewBox="0 0 64 64">
              <defs>
                <linearGradient id="cyberGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="45%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="gaugeGlow">
                  <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer aerospace tick marks */}
              <circle
                className="gauge-track-outer"
                cx="32" cy="32" r="28"
                strokeDasharray="2 3.5"
              />
              {/* Main track background */}
              <circle className="gauge-track" cx="32" cy="32" r="24" />
              {/* Dynamic glowing fill arc */}
              <circle
                className="gauge-fill"
                cx="32" cy="32" r="24"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={dashOffset}
                filter="url(#gaugeGlow)"
              />
            </svg>

            {/* Central HUD Percentage */}
            <div className="gauge-pct-center">
              <span className="gauge-num">{pct}</span>
              <span className="gauge-sym">%</span>
              <span className="gauge-sublabel">SYNC</span>
            </div>
          </div>

          {/* Telemetry Status Readout */}
          <div className="gauge-details">
            <div className="gauge-status-row">
              <span
                className={`gauge-beacon ${
                  isLive
                    ? 'pulse-cyan'
                    : pct >= 100
                    ? 'done-green'
                    : isAwaitingHuman
                    ? 'gate-amber'
                    : 'idle'
                }`}
              />
              <span
                className={`gauge-status-tag ${
                  isAwaitingHuman ? 'amber' : pct >= 100 ? 'green' : ''
                }`}
              >
                {isLive
                  ? activeStage?.isHuman
                    ? 'AWAITING GATE'
                    : 'ORCHESTRATING'
                  : pct >= 100
                  ? 'MISSION VERIFIED'
                  : isAwaitingHuman
                  ? activeIdx === DISPLAY_STAGES.length - 1
                    ? 'AWAITING FINAL SIGNOFF'
                    : 'ACTION REQUIRED'
                  : 'READY TO INITIATE'}
              </span>
            </div>

            <div className="gauge-active-title" title={ringLabel}>
              {ringLabel}
            </div>

            <div className="gauge-phase-meta">
              <span className="gauge-phase-name">{currentPhaseTitle}</span>
            </div>

            <div className="gauge-step-counter">
              <span className="step-accent">{doneCount}</span> of {DISPLAY_STAGES.length} Agents Synced
              {isAwaitingHuman && activeIdx === DISPLAY_STAGES.length - 1 && (
                <span style={{ color: 'var(--state-human)', marginLeft: 6, fontWeight: 700 }}>
                  · Final Step
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 15-Segment High-Density LED Array */}
        <div className="gauge-led-matrix" title="15-Stage Agent Cluster Array">
          {DISPLAY_STAGES.map((st, i) => {
            const isDone = i < activeIdx
            const isActive = i === activeIdx
            return (
              <div
                key={st.key}
                className={`led-segment ${isDone ? 'done' : isActive ? 'active' : 'idle'}`}
                title={`[${st.num}] ${st.label} · ${isDone ? 'Verified' : isActive ? 'Running' : 'Standby'}`}
              />
            )
          })}
        </div>
      </div>

      {/* 15 Agent Multi-Agent Pipeline Timeline */}
      <div className="pipeline-stages-scroll">
        <div className="pipeline-stages-rail-wrap">
          {PHASES.map((phase) => {
            const phaseStages = DISPLAY_STAGES.filter((s) => s.phaseId === phase.id)
            const phaseDoneCount = phaseStages.filter((s) => {
              const globalIdx = DISPLAY_STAGES.findIndex((ds) => ds.key === s.key)
              return globalIdx < activeIdx
            }).length
            const isPhaseActive = phaseStages.some((s) => {
              const globalIdx = DISPLAY_STAGES.findIndex((ds) => ds.key === s.key)
              return globalIdx === activeIdx
            })
            const isPhaseDone = phaseDoneCount === phaseStages.length

            return (
              <div key={phase.id} className="mission-phase-group">
                {/* Tactical Phase Header Divider */}
                <div className={`phase-tactical-header ${isPhaseActive ? 'active' : isPhaseDone ? 'done' : ''}`}>
                  <div className="phase-header-left">
                    <span className="phase-chip">{phase.short}</span>
                    <span className="phase-name">{phase.title.split('·')[1]?.trim()}</span>
                  </div>
                  <span className="phase-tally">
                    {isPhaseDone ? 'VERIFIED' : isPhaseActive ? `${phaseDoneCount}/${phaseStages.length} RUNNING` : `${phaseDoneCount}/${phaseStages.length}`}
                  </span>
                </div>

                {/* Phase Agent Cards */}
                <div className="phase-nodes-list">
                  {phaseStages.map((stage) => {
                    const globalIdx = DISPLAY_STAGES.findIndex((ds) => ds.key === stage.key)
                    const Icon = stage.icon
                    const isDone = globalIdx < activeIdx
                    const isActive = globalIdx === activeIdx
                    const isHuman = stage.isHuman
                    const isExpanded = expandedStage === stage.key

                    let statusCls = 'pending'
                    let pillText = 'STANDBY'
                    if (isDone) {
                      statusCls = 'done'
                      pillText = 'VERIFIED'
                    } else if (isActive) {
                      if (isHuman) {
                        statusCls = 'active-human'
                        pillText = 'GATE REQ.'
                      } else {
                        statusCls = 'active'
                        pillText = 'RUNNING'
                      }
                    }

                    return (
                      <div
                        key={stage.key}
                        ref={isActive ? activeNodeRef : null}
                        className={`agent-node-card ${statusCls} ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                      >
                        {/* Visual Circuit Rail & Glowing Beacon */}
                        <div className="node-rail">
                          <div className="node-beacon-socket">
                            {isDone ? (
                              <div className="beacon-done-core" title="Agent Verified">
                                <Check size={11} strokeWidth={3.5} />
                              </div>
                            ) : isActive ? (
                              <div className={`beacon-active-core ${isHuman ? 'human' : ''}`}>
                                {isLive && !isHuman ? (
                                  <Loader2 size={12} strokeWidth={3} className="spin-fast" />
                                ) : isHuman ? (
                                  <UserCheck size={12} strokeWidth={2.8} />
                                ) : (
                                  <span className="beacon-pulse-dot" />
                                )}
                              </div>
                            ) : (
                              <div className="beacon-pending-core">
                                <Icon size={10} strokeWidth={2.2} />
                              </div>
                            )}
                          </div>

                          {/* Circuit wire conduit between nodes */}
                          {globalIdx < DISPLAY_STAGES.length - 1 && (
                            <div className={`node-circuit-wire ${isDone ? 'wire-done' : isActive ? 'wire-active' : ''}`}>
                              {isActive && isLive && <span className="circuit-pulse-signal" />}
                            </div>
                          )}
                        </div>

                        {/* Agent Identity & Metadata Card Content */}
                        <div className="node-info-block">
                          <div className="node-top-meta">
                            <span className="node-idx-pill">{stage.num}</span>
                            <span className="node-agent-name">{stage.label}</span>
                            <span className={`node-state-pill ${statusCls}`}>
                              {isActive && isLive && <span className="micro-beacon" />}
                              {pillText}
                            </span>
                          </div>

                          <div className="node-subsystem-row">
                            <span className="node-subsystem-tag">{stage.subsystem}</span>
                            {isHuman && <span className="node-gate-tag">Human Gate</span>}
                            <span className="node-est-time">{stage.estTime}</span>
                          </div>

                          {/* Expandable Agent Architecture Drawer */}
                          {isExpanded && (
                            <div className="node-detail-drawer" onClick={(e) => e.stopPropagation()}>
                              <p className="node-desc">{stage.desc}</p>
                              <div className="node-meta-grid">
                                <div className="meta-item">
                                  <span className="meta-k">KEY:</span>
                                  <span className="meta-v">{stage.key}</span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-k">EST:</span>
                                  <span className="meta-v">{stage.estTime}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}