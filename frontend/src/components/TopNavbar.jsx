import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Clock, ChevronDown, Sparkles, User, Settings, LogOut, Check } from 'lucide-react'

export default function TopNavbar({
  onNewSession,
  onOpenHistory,
  onSearchSubmit,
}) {
  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const searchInputRef = useRef(null)
  const profileRef = useRef(null)

  // Global shortcut Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      const trimmed = searchValue.trim()
      if (trimmed && onSearchSubmit) {
        onSearchSubmit(trimmed)
      }
    }
  }

  return (
    <header className="top-nav-bar">
      {/* Left: Quick Research Query Search Bar */}
      <div className="top-nav-search-container">
        <div className="search-input-box">
          <Search size={16} className="search-box-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-box-input"
            placeholder="Ask a research question..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <kbd className="search-kbd-badge">Ctrl + K</kbd>
        </div>
      </div>

      {/* Right: Action Buttons & User Profile */}
      <div className="top-nav-actions">
        <button
          type="button"
          className="btn-new-session"
          onClick={onNewSession}
          title="Start fresh research session (Alt+N)"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Session</span>
        </button>

        <button
          type="button"
          className="btn-nav-history"
          onClick={onOpenHistory}
          title="Open Search History & Saved Ideas"
        >
          <Clock size={15} />
          <span>History</span>
        </button>

        {/* User Profile Avatar with Dropdown */}
        <div className="nav-profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="nav-avatar-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User profile"
          >
            <div className="avatar-circle">
              <span>ZB</span>
            </div>
            <ChevronDown size={14} className={`avatar-chevron ${profileOpen ? 'open' : ''}`} />
          </button>

          {profileOpen && (
            <div className="avatar-dropdown-menu">
              <div className="dropdown-user-info">
                <div className="user-name">Zahid Bilal</div>
                <div className="user-role">Research Director · FYP Lead</div>
              </div>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false)
                  if (onOpenHistory) onOpenHistory()
                }}
              >
                <Clock size={14} />
                <span>My Research Sessions</span>
              </button>
              <div className="dropdown-divider" />
              <div className="dropdown-version">
                <span>ResearchAI v2.4 · Multi-Agent LPU</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
