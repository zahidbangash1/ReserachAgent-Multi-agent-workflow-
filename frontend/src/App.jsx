import { useState, useCallback, useEffect, useRef } from 'react'
import {
  PartyPopper, Copy, Download, Check as CheckIcon,
  ListTree, Sparkles, Terminal, ArrowRight, ArrowLeft,
  Activity, Layers
} from 'lucide-react'
import { streamStartSession, streamResumeSession } from './api/client'
import { lastTraceLabel } from './lib/stages'
import TopNavbar from './components/TopNavbar'
import StatusSidebar from './components/StatusSidebar'
import QueryForm from './components/QueryForm'
import TopicApproval from './components/TopicApproval'
import GapApproval from './components/GapApproval'
import FinalReview from './components/FinalReview'
import ClarificationPrompt from './components/ClarificationPrompt'
import ThinkingIndicator from './components/ThinkingIndicator'
import ToastStack from './components/ToastStack'
import MetricsChart from './components/MetricsChart'
import ArchitectureModal from './components/ArchitectureModal'
import SearchHistoryModal from './components/SearchHistoryModal'
import KnowledgeModal from './components/KnowledgeModal'
import ReportViewer from './components/ReportViewer'

let toastCounter = 0

export default function App() {
  const [threadId, setThreadId] = useState(null)
  const [session, setSession] = useState(null)
  const [liveTrace, setLiveTrace] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])
  const [glowBurst, setGlowBurst] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState('')
  const wasCompleted = useRef(false)

  function handleCopyReport() {
    if (!session?.final_report) return
    navigator.clipboard.writeText(session.final_report).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  function handleDownloadReport() {
    if (!session?.final_report) return
    const blob = new Blob([session.final_report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-proposal-${threadId?.slice(0, 8) || 'report'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Keyboard shortcut Alt+N for new session
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        handleNewSession()
        pushToast('New research session initiated', 'info')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (session?.completed && !wasCompleted.current) {
      wasCompleted.current = true
      setGlowBurst(true)
      const t = setTimeout(() => setGlowBurst(false), 1400)
      return () => clearTimeout(t)
    }
    if (!session?.completed) wasCompleted.current = false
  }, [session?.completed])

  const pushToast = useCallback((message, type = 'info') => {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  function handleEvent(event) {
    if (event.type === 'started') {
      setThreadId(event.thread_id)
    } else if (event.type === 'node_update') {
      if (event.trace?.length) {
        setLiveTrace((prev) => [...prev, ...event.trace])
      }
    } else if (event.type === 'done') {
      setSession(event.session)
    } else if (event.type === 'error') {
      setError(event.message)
      pushToast('Pipeline anomaly detected', 'error')
    }
  }

  async function handleStart(query) {
    setLoading(true)
    setError(null)
    setLiveTrace([])
    try {
      await streamStartSession(query, handleEvent)
      pushToast('Autonomous research agents dispatched', 'success')
    } catch (err) {
      setError(err.message)
      pushToast('Failed to initialize session', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleResume(resumePayload, successMessage = 'Decision recorded') {
    if (!threadId) return
    setLoading(true)
    setError(null)
    try {
      await streamResumeSession(threadId, resumePayload, handleEvent)
      pushToast(successMessage, 'success')
    } catch (err) {
      setError(err.message)
      pushToast('Workflow resumption failure', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleNewSession() {
    setThreadId(null)
    setSession(null)
    setLiveTrace([])
    setError(null)
    setHistoryQuery('')
  }

  function handleSelectHistoryQuery(query) {
    setThreadId(null)
    setSession(null)
    setLiveTrace([])
    setError(null)
    setHistoryQuery(query)
    pushToast('Loaded query into research workstation', 'info')
  }

  function handleSidebarTab(tabKey) {
    if (tabKey === 'home') {
      handleNewSession()
    } else if (tabKey === 'agents' || tabKey === 'workflows') {
      setIsArchitectureOpen(true)
    } else if (tabKey === 'knowledge') {
      setIsKnowledgeOpen(true)
    } else if (tabKey === 'history') {
      setIsHistoryOpen(true)
    }
  }

  const displayTrace = loading ? liveTrace : session?.trace || []
  const liveLabel = loading ? lastTraceLabel(liveTrace) : null
  const wordCount = (session?.final_report || '').trim().split(/\s+/).filter(Boolean).length

  function renderMainContent() {
    if (!threadId) {
      return (
        <>
          <QueryForm
            onSubmit={handleStart}
            loading={loading}
            initialQuery={historyQuery}
          />
          {loading && <ThinkingIndicator liveLabel={liveLabel} />}
        </>
      )
    }

    const interrupt = session?.interrupt

    // Active Human-in-the-Loop Interrupt Stage
    if (interrupt && !loading) {
      const { stage, payload } = interrupt
      return (
        <div className="pipeline-active-container">
          <div className="pipeline-session-header">
            <button
              type="button"
              className="btn-back-workspace"
              onClick={handleNewSession}
              title="Return to workstation"
            >
              <ArrowLeft size={14} />
              <span>Back to Workstation</span>
            </button>
            <div className="session-tag">
              <span>Session ID:</span> <code>{threadId.slice(0, 12)}…</code>
            </div>
          </div>

          {stage === 'topic_approval' && (
            <TopicApproval
              payload={payload}
              loading={loading}
              onResume={(p) =>
                handleResume(
                  p,
                  p.approved
                    ? 'Topic approved · Initiating literature scan'
                    : 'Returned for re-ideation'
                )
              }
            />
          )}

          {stage === 'gap_approval' && (
            <GapApproval
              payload={payload}
              loading={loading}
              onResume={(p) =>
                handleResume(
                  p,
                  p.approved
                    ? 'Gaps approved · Drafting proposal architecture'
                    : 'Returned for literature re-scan'
                )
              }
            />
          )}

          {stage === 'final_review' && (
            <FinalReview
              payload={payload}
              loading={loading}
              onResume={(p) =>
                handleResume(
                  p,
                  p.approved ? 'Proposal finalized 🎉' : 'Sent back for revisions'
                )
              }
            />
          )}

          {stage !== 'topic_approval' &&
            stage !== 'gap_approval' &&
            stage !== 'final_review' && (
              <ClarificationPrompt
                payload={payload}
                loading={loading}
                onResume={(answer) =>
                  handleResume(answer, 'Clarification processed · Resuming')
                }
              />
            )}
        </div>
      )
    }

    if (loading) {
      return (
        <div className="pipeline-active-container">
          <div className="pipeline-session-header">
            <button
              type="button"
              className="btn-back-workspace"
              onClick={handleNewSession}
            >
              <ArrowLeft size={14} />
              <span>Back to Workstation</span>
            </button>
            <div className="session-tag">
              <span>Session ID:</span> <code>{threadId.slice(0, 12)}…</code>
            </div>
          </div>
          <ThinkingIndicator liveLabel={liveLabel} />
        </div>
      )
    }

    if (session?.completed) {
      return (
        <div className="pipeline-active-container">
          <div className="pipeline-session-header">
            <button
              type="button"
              className="btn-back-workspace"
              onClick={handleNewSession}
            >
              <ArrowLeft size={14} />
              <span>Start New Research Session</span>
            </button>
            <div className="session-tag">
              <span>Session ID:</span> <code>{threadId.slice(0, 12)}…</code>
            </div>
          </div>

          <div className="panel glass-panel completion-panel">
            <div className="completion-banner glass-celebration">
              <div className="cb-left">
                <div className="cb-icon glow-cyan">
                  <PartyPopper size={24} />
                </div>
                <div>
                  <h2>Autonomous Research Synthesis Complete</h2>
                  <div className="cb-stats">
                    <ListTree size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 5 }} />
                    15 Stages Verified &middot; {wordCount.toLocaleString()} Words &middot; IEEE Transactions Standard
                  </div>
                </div>
              </div>
              <div className="cb-actions">
                <button className="cb-btn-secondary" onClick={handleCopyReport} disabled={!session.final_report}>
                  {copied ? <CheckIcon size={14} color="var(--success)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
                </button>
                <button className="cb-btn-primary" onClick={handleDownloadReport} disabled={!session.final_report}>
                  <Download size={14} />
                  <span>Export .md</span>
                </button>
              </div>
            </div>

            <MetricsChart reportMarkdown={session.final_report} />
            <ReportViewer reportMarkdown={session.final_report} />
          </div>
        </div>
      )
    }

    return (
      <div className="panel glass-panel">
        <p className="hint">
          Pipeline status: <code className="status-code">{session?.status || 'Active'}</code>
        </p>
      </div>
    )
  }

  return (
    <div className="app-main-layout">
      {/* Ambient background glow mesh */}
      <div className="bg-mesh" aria-hidden="true" />

      {/* Left Navigation Sidebar */}
      <StatusSidebar
        onSelectTab={handleSidebarTab}
        onNewSession={handleNewSession}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        threadId={threadId}
        isLive={loading}
      />

      {/* Center-Right Main Workstation Stage */}
      <div className="app-content-wrapper">
        {/* Top Navigation Bar */}
        <TopNavbar
          onNewSession={handleNewSession}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onSearchSubmit={handleStart}
        />

        <main className="app-main-viewport">
          {error && <div className="error-banner glass-error">{error}</div>}
          <div className="viewport-inner-container">
            {renderMainContent()}
          </div>
        </main>
      </div>

      <ToastStack toasts={toasts} />

      {/* System Architecture Spec Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* PostgreSQL Stored Searches & Ideas Modal */}
      <SearchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectQuery={handleSelectHistoryQuery}
      />

      {/* Knowledge Base Modal */}
      <KnowledgeModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />
    </div>
  )
}