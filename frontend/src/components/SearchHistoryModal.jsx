import { useState, useEffect } from 'react'
import {
  X, Database, Clock, RefreshCw, CheckCircle2,
  ChevronDown, ChevronUp, Sparkles, Lightbulb, ArrowUpRight, Copy, Check
} from 'lucide-react'
import { getSearchHistory } from '../api/client'

export default function SearchHistoryModal({ isOpen, onClose, onSelectQuery }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedThread, setExpandedThread] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen])

  async function fetchHistory() {
    setLoading(true)
    setError(null)
    try {
      const data = await getSearchHistory(50)
      setHistory(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch search history')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyQuery(query, id) {
    navigator.clipboard.writeText(query).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  function toggleExpand(threadId) {
    setExpandedThread((prev) => (prev === threadId ? null : threadId))
  }

  function formatDate(isoStr) {
    if (!isoStr) return 'Unknown'
    try {
      const date = new Date(isoStr)
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoStr
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container glass-panel history-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '92vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-left">
            <div className="modal-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Database size={18} />
            </div>
            <div>
              <h2 className="modal-heading">PostgreSQL Search History</h2>
              <p className="modal-sub">
                Live stored queries and generated ideas from <code style={{ color: '#38bdf8' }}>ResearchAgent</code> database
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="cb-btn-secondary"
              onClick={fetchHistory}
              disabled={loading}
              title="Refresh from PostgreSQL"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={13} className={loading ? 'spin-slow' : ''} />
              <span>Refresh</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.25rem' }}>
          {/* DB Connection Status Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.85rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ color: 'var(--text-muted)' }}>PostgreSQL Engine:</span>
              <strong style={{ color: '#f1f5f9' }}>localhost:5432 / ResearchAgent</strong>
            </div>
            <span style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
              {history.length} {history.length === 1 ? 'record' : 'records'} stored
            </span>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.8rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {loading && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <RefreshCw size={24} className="spin-slow" style={{ margin: '0 auto 0.75rem', display: 'block', color: '#38bdf8' }} />
              Connecting to PostgreSQL and fetching stored ideas...
            </div>
          )}

          {!loading && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Lightbulb size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No searches stored yet in your database.</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '0.35rem' }}>
                Type an idea prompt in the workstation to automatically persist it and its generated ideas here!
              </p>
            </div>
          )}

          {/* List of Searches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((item) => {
              const isExpanded = expandedThread === item.thread_id
              const ideas = item.ideas || []
              const hasIdeas = ideas.length > 0

              return (
                <div
                  key={item.thread_id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.45)',
                    border: isExpanded ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header Row */}
                  <div
                    style={{
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleExpand(item.thread_id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: item.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                            color: item.status === 'completed' ? '#34d399' : '#38bdf8',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.status}
                        </span>

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} />
                          {formatDate(item.created_at)}
                        </span>

                        {item.ideas_count > 0 && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(192, 132, 252, 0.15)',
                              color: '#c084fc',
                              fontWeight: 600,
                            }}
                          >
                            {item.ideas_count} {item.ideas_count === 1 ? 'Idea' : 'Ideas'} Generated
                          </span>
                        )}

                        {item.has_report && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              fontWeight: 600,
                            }}
                          >
                            Report Ready
                          </span>
                        )}
                      </div>

                      <h3
                        style={{
                          margin: 0,
                          fontSize: '0.92rem',
                          color: '#f8fafc',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.query}
                      </h3>

                      {item.selected_idea_title && (
                        <div
                          style={{
                            marginTop: '0.35rem',
                            fontSize: '0.76rem',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Sparkles size={12} />
                          <span>Selected: {item.selected_idea_title}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="cb-btn-secondary"
                        onClick={() => handleCopyQuery(item.query, item.id)}
                        title="Copy query text"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                      >
                        {copiedId === item.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>

                      {onSelectQuery && (
                        <button
                          type="button"
                          className="cb-btn-secondary"
                          onClick={() => {
                            onSelectQuery(item.query)
                            onClose()
                          }}
                          title="Load into workstation"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem' }}
                        >
                          <ArrowUpRight size={12} />
                          <span>Load</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(item.thread_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                        }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section: Generated Ideas */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '0.85rem 1rem',
                        background: 'rgba(10, 14, 26, 0.7)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Lightbulb size={13} color="#f59e0b" />
                        <span>Generated FYP Ideas Stored in PostgreSQL</span>
                      </div>

                      {!hasIdeas ? (
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                          Ideas for this session have not been generated yet or pipeline is in inception.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {ideas.map((idea, idx) => (
                            <div
                              key={idea.idea_id || idx}
                              style={{
                                padding: '0.65rem 0.8rem',
                                background: idea.is_selected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                border: idea.is_selected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '6px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  {idea.is_selected && (
                                    <CheckCircle2 size={13} color="#38bdf8" />
                                  )}
                                  <strong style={{ fontSize: '0.83rem', color: idea.is_selected ? '#38bdf8' : '#f1f5f9' }}>
                                    {idea.title}
                                  </strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  {idea.domain && (
                                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
                                      {idea.domain}
                                    </span>
                                  )}
                                  {idea.feasibility_score != null && (
                                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 600 }}>
                                      Feasibility: {idea.feasibility_score}/10
                                    </span>
                                  )}
                                </div>
                              </div>
                              {idea.core_problem && (
                                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                  <strong style={{ color: 'var(--text-faint)' }}>Problem: </strong>
                                  {idea.core_problem}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
