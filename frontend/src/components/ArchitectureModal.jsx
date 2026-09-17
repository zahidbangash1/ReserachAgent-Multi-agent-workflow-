import { X, Layers, Cpu, Database, UserCheck, Shield, BookOpen, ArrowRight, Check } from 'lucide-react'
import { DISPLAY_STAGES } from '../lib/stages'

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const PHASES = [
    {
      id: 'phase-1',
      num: '01',
      title: 'Inception & Scoping',
      desc: 'Intent routing, topic prerequisite verification, candidate ideation & human gatekeeping.',
      stages: ['router_agent', 'ideation', 'human_topic_approval']
    },
    {
      id: 'phase-2',
      num: '02',
      title: 'Literature & Rigor',
      desc: 'Semantic Scholar Graph API + Tavily Academic retrieval, DOI validation & gap discovery.',
      stages: ['literature_review_agent', 'citation_validator', 'gap_finder', 'human_gap_approval']
    },
    {
      id: 'phase-3',
      num: '03',
      title: 'Architecture & Feasibility',
      desc: 'IEEE-structured proposal drafting, methodology workflow design & technical feasibility review.',
      stages: ['proposal_writer', 'methodology_designer', 'feasibility_reviewer']
    },
    {
      id: 'phase-4',
      num: '04',
      title: 'Empirical & Synthesis',
      desc: 'Simulated experiment execution, baseline metric evaluation, final synthesis & signoff.',
      stages: ['experiment_planner', 'experiment_executor', 'results_evaluator', 'report_writer', 'human_final_review']
    },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-left">
            <div className="modal-icon-badge">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="modal-heading">Autonomous Research Architecture</h2>
              <p className="modal-sub">15 LangGraph Autonomous Agents with 4 Human Governance Checkpoints</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Tech Stack Spec Bar */}
          <div className="tech-spec-bar">
            <div className="spec-col">
              <span className="spec-label">COGNITIVE ENGINE</span>
              <span className="spec-val">Groq LPU (GPT-OSS 20B)</span>
            </div>
            <div className="spec-col">
              <span className="spec-label">ORCHESTRATION</span>
              <span className="spec-val">LangGraph Stateful Graph</span>
            </div>
            <div className="spec-col">
              <span className="spec-label">LITERATURE APIS</span>
              <span className="spec-val">Semantic Scholar + Tavily</span>
            </div>
            <div className="spec-col">
              <span className="spec-label">STATE PERSISTENCE</span>
              <span className="spec-val">Checkpointed MemorySaver</span>
            </div>
          </div>

          {/* Phase Grid */}
          <div className="modal-phases-grid">
            {PHASES.map((phase) => (
              <div key={phase.id} className="modal-phase-card">
                <div className="phase-header-row">
                  <span className="phase-badge">PHASE {phase.num}</span>
                  <h3 className="phase-card-title">{phase.title}</h3>
                </div>
                <p className="phase-card-desc">{phase.desc}</p>
                <div className="phase-stages-chips">
                  {phase.stages.map((stKey) => {
                    const st = DISPLAY_STAGES.find((s) => s.key === stKey)
                    if (!st) return null
                    return (
                      <div key={stKey} className={`phase-st-chip ${st.isHuman ? 'human' : ''}`}>
                        {st.isHuman ? <UserCheck size={11} /> : <Check size={11} />}
                        <span>{st.label}</span>
                        {st.isHuman && <span className="human-tag">GATE</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Governance Notice */}
          <div className="governance-notice-box">
            <Shield size={16} className="gov-icon" />
            <div>
              <strong>Human-in-the-Loop Safeguards:</strong> The pipeline pauses execution via StateGraph <code>interrupt()</code> at critical checkpoints (Topic Approval, Literature Gaps, Feasibility, and Final Proposal). You maintain 100% supervisory authority to steer or reject candidate directions.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="modal-btn-confirm" onClick={onClose}>
            <span>Understood · Return to Workstation</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
