import React from 'react'
import { X, Database, HardDrive, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function KnowledgeModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="status-dot-pulse" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Knowledge Base & Vector Architecture</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
            ResearchAI indexes academic literature, user session checkpoints, and generated proposal graphs using a hybrid storage cluster:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Database size={16} className="text-cyan" />
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>PostgreSQL RDS</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Session records, ideation rankings, approval logs, and final generated proposals.</p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Connected & Synced
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <HardDrive size={16} className="text-purple" />
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>SQLite Checkpointer</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Local LangGraph atomic state graph checkpointer for thread interruption & replay.</p>
              <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Active (checkpoints.db)
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Cpu size={16} className="text-mint" />
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Academic Search Index</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Real-time literature queries via Tavily Academic Search with automated citation scoring.</p>
            <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> Operational
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
