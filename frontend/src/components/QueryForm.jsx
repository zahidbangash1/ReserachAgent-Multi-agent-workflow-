import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles, ArrowRight, Bot, SlidersHorizontal, Globe,
  ChevronDown, FileText, BookOpen, Share2, Lightbulb,
  Music, Terminal, Check
} from 'lucide-react'
import HeroGraphic from './HeroGraphic'

const RESEARCH_MODES = [
  { id: 'full-cycle', label: 'Autonomous Full-Cycle' },
  { id: 'lit-scan', label: 'Exploratory Literature Scan' },
  { id: 'rigorous-fyp', label: 'Rigorous FYP Track (IEEE)' },
  { id: 'methodology', label: 'Methodology Deep-Dive' },
]

const DOMAINS = [
  { id: 'cs-ai', label: 'Computer Science & AI' },
  { id: 'health-nlp', label: 'Healthcare & Clinical NLP' },
  { id: 'cybersecurity', label: 'Cybersecurity & Graph ML' },
  { id: 'smart-grids', label: 'Smart Grids & Distributed Systems' },
  { id: 'robotics', label: 'Robotics & Autonomous Systems' },
]

const TEMPLATES = [
  {
    id: 'proposal',
    title: 'Research Proposal',
    description: 'Generate comprehensive research proposals with citations.',
    icon: FileText,
    iconColor: 'icon-blue',
    defaultQuery: 'Multi-modal transformers for anomaly detection in distributed smart power grids with federated edge validation',
    mode: 'full-cycle',
    domain: 'smart-grids',
  },
  {
    id: 'literature',
    title: 'Literature Review',
    description: 'Find and analyze relevant research papers and sources.',
    icon: BookOpen,
    iconColor: 'icon-purple',
    defaultQuery: 'Comprehensive survey of retrieval-augmented generation benchmarks, hallucination mitigation techniques, and latency trade-offs',
    mode: 'lit-scan',
    domain: 'cs-ai',
  },
  {
    id: 'methodology',
    title: 'Methodology Design',
    description: 'Suggest and evaluate research methodologies.',
    icon: Share2,
    iconColor: 'icon-green',
    defaultQuery: 'Design a privacy-preserving federated contrastive learning methodology for sparse medical imaging segmentation',
    mode: 'methodology',
    domain: 'health-nlp',
  },
  {
    id: 'hypothesis',
    title: 'Hypothesis Generation',
    description: 'Create testable hypotheses based on current literature.',
    icon: Lightbulb,
    iconColor: 'icon-amber',
    defaultQuery: 'Investigating if state-space models (Mamba) outperform attention mechanisms in ultra-long context DNA genomics sequencing',
    mode: 'rigorous-fyp',
    domain: 'cs-ai',
  },
]

export default function QueryForm({
  onSubmit,
  loading,
  initialQuery = '',
}) {
  const [activeTab, setActiveTab] = useState('proposal') // 'proposal' | 'custom'
  const [queryText, setQueryText] = useState(initialQuery)
  const [charCount, setCharCount] = useState(initialQuery.length)
  
  const [selectedMode, setSelectedMode] = useState(RESEARCH_MODES[0])
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0])
  
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false)
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false)

  const textareaRef = useRef(null)
  const modeRef = useRef(null)
  const domainRef = useRef(null)

  // Sync initial query
  useEffect(() => {
    if (initialQuery) {
      setQueryText(initialQuery)
      setCharCount(initialQuery.length)
    }
  }, [initialQuery])

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (modeRef.current && !modeRef.current.contains(e.target)) {
        setModeDropdownOpen(false)
      }
      if (domainRef.current && !domainRef.current.contains(e.target)) {
        setDomainDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleTextChange(e) {
    const val = e.target.value
    if (val.length <= 2000) {
      setQueryText(val)
      setCharCount(val.length)
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      triggerSubmit()
    }
  }

  function triggerSubmit() {
    const trimmed = queryText.trim()
    if (trimmed && !loading) {
      onSubmit(trimmed)
    }
  }

  function handleTemplateClick(tmpl) {
    setQueryText(tmpl.defaultQuery)
    setCharCount(tmpl.defaultQuery.length)
    
    const matchedMode = RESEARCH_MODES.find(m => m.id === tmpl.mode) || RESEARCH_MODES[0]
    const matchedDomain = DOMAINS.find(d => d.id === tmpl.domain) || DOMAINS[0]
    
    setSelectedMode(matchedMode)
    setSelectedDomain(matchedDomain)
    setActiveTab(tmpl.id === 'proposal' ? 'proposal' : 'custom')

    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <div className="research-home-stage">
      {/* 1. Hero Title & Visual Banner */}
      <section className="hero-banner-section">
        <div className="hero-text-content">
          <div className="hero-eyebrow-badge">
            <Bot size={13} className="eyebrow-icon" />
            <span>AI AGENT</span>
          </div>

          <h1 className="hero-main-title">
            Research Proposal <span className="hero-title-accent">Intelligence</span>
          </h1>

          <p className="hero-main-description">
            End-to-end hypothesis formation, literature evaluation, and methodology synthesis
            with guaranteed human-in-the-loop governance at each critical checkpoint.
          </p>
        </div>

        <div className="hero-visual-content">
          <HeroGraphic />
        </div>
      </section>

      {/* 2. Main Interactive Query Card */}
      <section className="main-query-card">
        {/* Top Mode Tabs */}
        <div className="query-tabs-header">
          <button
            type="button"
            className={`query-tab-btn ${activeTab === 'proposal' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposal')}
          >
            <Music size={14} className="tab-icon" />
            <span>Research Proposal</span>
          </button>

          <button
            type="button"
            className={`query-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            <Terminal size={14} className="tab-icon" />
            <span>Custom Query</span>
          </button>
        </div>

        {/* Textarea Input Body */}
        <div className="query-input-body">
          <textarea
            ref={textareaRef}
            className="query-hero-textarea"
            rows={4}
            value={queryText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Multi-modal transformers for anomaly detection in distributed smart power grids with federated edge validation..."
            disabled={loading}
          />
          <div className="query-char-counter">
            <span>{charCount}/2000</span>
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="query-bottom-controls">
          <div className="controls-left-dropdowns">
            {/* Mode Dropdown */}
            <div className="custom-dropdown-container" ref={modeRef}>
              <button
                type="button"
                className="dropdown-trigger-btn"
                onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                disabled={loading}
              >
                <SlidersHorizontal size={14} className="trigger-icon" />
                <span className="trigger-label">{selectedMode.label}</span>
                <ChevronDown size={13} className={`trigger-chevron ${modeDropdownOpen ? 'rotate' : ''}`} />
              </button>

              {modeDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {RESEARCH_MODES.map((mode) => (
                    <div
                      key={mode.id}
                      className={`dropdown-menu-option ${selectedMode.id === mode.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedMode(mode)
                        setModeDropdownOpen(false)
                      }}
                    >
                      <span>{mode.label}</span>
                      {selectedMode.id === mode.id && <Check size={13} className="text-cyan" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Domain Dropdown */}
            <div className="custom-dropdown-container" ref={domainRef}>
              <button
                type="button"
                className="dropdown-trigger-btn"
                onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                disabled={loading}
              >
                <Globe size={14} className="trigger-icon" />
                <span className="trigger-label">{selectedDomain.label}</span>
                <ChevronDown size={13} className={`trigger-chevron ${domainDropdownOpen ? 'rotate' : ''}`} />
              </button>

              {domainDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {DOMAINS.map((domain) => (
                    <div
                      key={domain.id}
                      className={`dropdown-menu-option ${selectedDomain.id === domain.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDomain(domain)
                        setDomainDropdownOpen(false)
                      }}
                    >
                      <span>{domain.label}</span>
                      {selectedDomain.id === domain.id && <Check size={13} className="text-cyan" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action Button */}
          <button
            type="button"
            className="btn-launch-pipeline"
            onClick={triggerSubmit}
            disabled={loading || !queryText.trim()}
          >
            <Sparkles size={16} className="btn-sparkle" />
            <span>{loading ? 'Synthesizing...' : 'Launch Autonomous Research Pipeline'}</span>
            <ArrowRight size={15} className="btn-arrow" />
          </button>
        </div>
      </section>

      {/* 3. Popular Research Templates */}
      <section className="popular-templates-section">
        <div className="templates-header-row">
          <div className="templates-title-group">
            <Sparkles size={16} className="templates-sparkle-icon" />
            <h2 className="templates-heading">Popular Research Templates</h2>
          </div>
          <button
            type="button"
            className="btn-view-all-templates"
            onClick={() => handleTemplateClick(TEMPLATES[0])}
          >
            <span>View All Templates</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 4-Column Template Cards Grid */}
        <div className="templates-cards-grid">
          {TEMPLATES.map((tmpl) => {
            const IconComp = tmpl.icon
            return (
              <div
                key={tmpl.id}
                className="template-card"
                onClick={() => handleTemplateClick(tmpl)}
                title={`Load template: ${tmpl.title}`}
              >
                <div className="card-top-row">
                  <div className={`template-icon-badge ${tmpl.iconColor}`}>
                    <IconComp size={18} />
                  </div>
                </div>

                <div className="template-card-body">
                  <h3 className="template-card-title">{tmpl.title}</h3>
                  <p className="template-card-desc">{tmpl.description}</p>
                </div>

                <div className="template-card-footer">
                  <ArrowRight size={14} className="template-card-arrow" />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}