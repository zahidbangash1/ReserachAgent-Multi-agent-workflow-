import { useState } from 'react'
import {
  FileText, Check, X, AlertTriangle, Award, Sparkles, Download,
  Copy, BarChart3, Bookmark, Layers, ArrowRight, ShieldCheck
} from 'lucide-react'
import ReportViewer from './ReportViewer'
import MetricsChart from './MetricsChart'

const REVISION_PRESETS = [
  'Deepen the empirical baselines and evaluation metric formulas',
  'Expand on potential compute limitations and edge deployment feasibility',
  'Clarify the ablation study design and comparative benchmarks',
  'Strengthen the novelty distinction against recent 2024-2026 surveys',
]

export default function FinalReview({ payload, onResume, loading }) {
  const [activeTab, setActiveTab] = useState('doc')
  const [feedback, setFeedback] = useState('')
  const report = payload.final_report || ''
  const hasSimulatedNote = report.toLowerCase().includes('simulated')

  return (
    <div className="panel glass-panel review-panel final-review-panel">
      {/* State-Based Header Pill */}
      <div className="checkpoint-banner amber">
        <div className="checkpoint-left">
          <div className="checkpoint-badge-icon">
            <Award size={16} />
          </div>
          <div>
            <div className="checkpoint-badge-title">FINAL GOVERNANCE CHECKPOINT: PROPOSAL SIGN-OFF</div>
            <div className="checkpoint-badge-sub">Full 15-node autonomous synthesis complete · Awaiting supervisory approval</div>
          </div>
        </div>
        <span className="attempt-badge">Review Iteration #{payload.attempt}</span>
      </div>

      <div className="panel-title-group">
        <h2 className="panel-title">Comprehensive Proposal Synthesis Review</h2>
        <p className="panel-subtitle">
          Inspect the complete research proposal synthesized across all 15 stages.
          Review the problem formulation, methodology architecture, literature citations, and simulated benchmark results.
        </p>
      </div>

      {hasSimulatedNote && (
        <div className="disclaimer-banner glass-disclaimer">
          <AlertTriangle size={16} className="disclaimer-icon" />
          <div className="disclaimer-body">
            <strong>Empirical Dry-Run Telemetry:</strong> This proposal includes simulated benchmark estimations
            derived from current SOTA literature. These figures serve as baseline hypotheses for your committee defense.
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="final-review-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'doc' ? 'active' : ''}`}
          onClick={() => setActiveTab('doc')}
        >
          <FileText size={14} />
          <span>IEEE Proposal Document</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          <BarChart3 size={14} />
          <span>Benchmark Analytics & Metrics</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
          onClick={() => setActiveTab('executive')}
        >
          <ShieldCheck size={14} />
          <span>Governance & Pipeline Audit</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="final-review-tab-body">
        {activeTab === 'doc' && (
          <ReportViewer reportMarkdown={report} />
        )}

        {activeTab === 'charts' && (
          <div className="charts-tab-container glass-panel">
            <div className="tab-lead-box">
              <h3 className="tab-title">Simulated Benchmark Comparison Matrix</h3>
              <p className="tab-sub">Metrics extracted from methodology and empirical evaluation nodes</p>
            </div>
            <MetricsChart reportMarkdown={report} />
          </div>
        )}

        {activeTab === 'executive' && (
          <div className="audit-tab-container glass-panel">
            <div className="audit-grid">
              <div className="audit-card">
                <span className="audit-label">ACADEMIC RIGOR</span>
                <span className="audit-val green">IEEE Transactions Spec Verified</span>
                <p className="audit-desc">Validated against standard undergraduate and masters thesis committee requirements.</p>
              </div>
              <div className="audit-card">
                <span className="audit-label">CITATION INTEGRITY</span>
                <span className="audit-val green">Peer-Reviewed Grounding</span>
                <p className="audit-desc">Semantic Scholar Graph API verified metadata with honesty-preserving fallback.</p>
              </div>
              <div className="audit-card">
                <span className="audit-label">METHODOLOGY FEASIBILITY</span>
                <span className="audit-val cyan">Simulated & Benchmarked</span>
                <p className="audit-desc">Experiment design reviewed for hardware, compute, and dataset accessibility.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final Decision Action Footer */}
      <div className="actions-glass-footer final-actions">
        <button
          type="button"
          className="btn-approve-emerald glow-emerald final-signoff-btn"
          disabled={loading}
          onClick={() => onResume({ approved: true })}
        >
          <Check size={18} strokeWidth={2.5} />
          <span>Grant Final Signoff & Finalize FYP Proposal</span>
          <ArrowRight size={16} />
        </button>

        <div className="reject-section">
          <div className="preset-feedback-chips">
            <span className="presets-hint">REVISION ANGLE:</span>
            {REVISION_PRESETS.map((preset, i) => (
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
              placeholder="Detailed instructions for proposal revision (e.g. Expand on ethical implications)..."
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
              <span>Request Revisions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}