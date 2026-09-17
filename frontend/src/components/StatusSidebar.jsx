import React, { useState } from 'react'
import {
  Home, Bot, GitBranch, Database, Clock, Settings,
  Activity, CheckCircle2, ChevronRight, Sparkles, Zap,
  Terminal, ShieldCheck
} from 'lucide-react'

export default function StatusSidebar({
  activeTab = 'home',
  onSelectTab,
  onNewSession,
  onOpenHistory,
  onOpenArchitecture,
  threadId,
  isLive,
}) {
  const [currentTab, setCurrentTab] = useState('home')

  function handleTabClick(tabKey) {
    setCurrentTab(tabKey)
    if (onSelectTab) onSelectTab(tabKey)

    if (tabKey === 'home' && onNewSession) {
      onNewSession()
    } else if (tabKey === 'history' && onOpenHistory) {
      onOpenHistory()
    } else if ((tabKey === 'agents' || tabKey === 'workflows') && onOpenArchitecture) {
      onOpenArchitecture()
    }
  }

  return (
    <aside className="app-left-sidebar">
      {/* 1. Brand Header */}
      <div className="sidebar-brand-header">
        <div className="brand-logo-sparkle">
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="sparkle-svg">
            <path
              d="M14 0C14 7.732 20.268 14 28 14C20.268 14 14 20.268 14 28C14 20.268 7.732 14 0 14C7.732 14 14 7.732 14 0Z"
              fill="url(#sparkleGradient)"
            />
            <defs>
              <linearGradient id="sparkleGradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="brand-titles">
          <h1 className="brand-app-name">ResearchAI</h1>
          <p className="brand-app-sub">Intelligent Research Assistant</p>
        </div>
      </div>

      {/* 2. Main Navigation Menu */}
      <nav className="sidebar-nav-menu">
        <button
          type="button"
          className={`nav-menu-item ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => handleTabClick('home')}
        >
          <Home size={17} className="nav-item-icon" />
          <span className="nav-item-label">Home</span>
        </button>

        <button
          type="button"
          className={`nav-menu-item ${currentTab === 'agents' ? 'active' : ''}`}
          onClick={() => handleTabClick('agents')}
        >
          <Bot size={17} className="nav-item-icon" />
          <span className="nav-item-label">Agents</span>
        </button>

        <button
          type="button"
          className={`nav-menu-item ${currentTab === 'workflows' ? 'active' : ''}`}
          onClick={() => handleTabClick('workflows')}
        >
          <GitBranch size={17} className="nav-item-icon" />
          <span className="nav-item-label">Workflows</span>
        </button>

        <button
          type="button"
          className={`nav-menu-item ${currentTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => handleTabClick('knowledge')}
        >
          <Database size={17} className="nav-item-icon" />
          <span className="nav-item-label">Knowledge Base</span>
        </button>

        <button
          type="button"
          className={`nav-menu-item ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabClick('history')}
        >
          <Clock size={17} className="nav-item-icon" />
          <span className="nav-item-label">History</span>
        </button>

        <button
          type="button"
          className={`nav-menu-item ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabClick('settings')}
        >
          <Settings size={17} className="nav-item-icon" />
          <span className="nav-item-label">Settings</span>
        </button>
      </nav>

      {/* 3. System Status Card */}
      <div className="sidebar-status-card">
        <div className="status-header">
          <div className="status-dot-pulse" />
          <span className="status-title">System Status</span>
        </div>
        <div className="status-operational-line">
          <span className="op-dot">●</span>
          <span>All Systems Operational</span>
        </div>

        <div className="status-metrics-list">
          <div className="status-metric-row">
            <span className="metric-name">
              <Bot size={13} className="inline-icon" /> Agent
            </span>
            <span className="metric-val text-cyan">4 online</span>
          </div>

          <div className="status-metric-row">
            <span className="metric-name">
              <Database size={13} className="inline-icon" /> Vector DB
            </span>
            <span className="metric-val text-mint">Healthy</span>
          </div>

          <div className="status-metric-row">
            <span className="metric-name">
              <Activity size={13} className="inline-icon" /> Web Search
            </span>
            <span className="metric-val text-mint">Healthy</span>
          </div>

          <div className="status-metric-row">
            <span className="metric-name">
              <Zap size={13} className="inline-icon" /> LLM
            </span>
            <span className="metric-val text-cyan">Connected</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Promotional Card */}
      <div
        className="sidebar-bottom-promo-card"
        onClick={onOpenArchitecture}
        title="Inspect multi-agent neural architecture"
      >
        <div className="promo-sphere-icon">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="sphere-mini-svg">
            <circle cx="20" cy="20" r="18" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" />
            <ellipse cx="20" cy="20" rx="16" ry="6" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="1" strokeDasharray="2 2" />
            <ellipse cx="20" cy="20" rx="6" ry="16" stroke="rgba(192, 132, 252, 0.6)" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="20" cy="20" r="3" fill="#60a5fa" />
          </svg>
        </div>
        <div className="promo-text-content">
          <div className="promo-headline">
            <span>Smarter Research</span>
            <span className="break-line">Faster Insights</span>
          </div>
          <div className="promo-subline">
            <span>Powered by Multi-Agent AI</span>
            <ChevronRight size={13} className="promo-arrow" />
          </div>
        </div>
      </div>
    </aside>
  )
}