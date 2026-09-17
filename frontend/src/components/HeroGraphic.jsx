import React from 'react'
import { BookOpen, Network, Database, ShieldCheck, Sparkles } from 'lucide-react'

export default function HeroGraphic() {
  return (
    <div className="hero-graphic-container">
      {/* Glow aura behind graphic */}
      <div className="hero-sphere-glow" />

      {/* SVG Neon Waves and Neural Web */}
      <svg
        className="hero-wave-svg"
        viewBox="0 0 540 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waveGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="waveGradPurple" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="80%" stopColor="#ec4899" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="sphereCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="80%" stopColor="#1e1b4b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
          </radialGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Sinusoidal Flow Waves */}
        <path
          d="M 10 170 C 90 120, 160 210, 240 160 C 320 110, 390 190, 480 140"
          stroke="url(#waveGradCyan)"
          strokeWidth="2.5"
          fill="none"
          className="wave-line wave-line-1"
        />
        <path
          d="M 30 185 C 110 135, 180 225, 260 170 C 340 120, 410 180, 500 135"
          stroke="url(#waveGradPurple)"
          strokeWidth="2"
          fill="none"
          className="wave-line wave-line-2"
        />
        <path
          d="M 0 155 C 80 195, 170 125, 250 175 C 330 225, 420 130, 510 150"
          stroke="rgba(56, 189, 248, 0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
          className="wave-line wave-line-3"
        />
        <path
          d="M 50 190 C 130 160, 210 210, 290 155 C 370 100, 450 165, 530 130"
          stroke="rgba(168, 85, 247, 0.45)"
          strokeWidth="1.2"
          fill="none"
          className="wave-line wave-line-4"
        />

        {/* Digital Spherical Orb */}
        <g transform="translate(420, 130)">
          {/* Outer Ring Glow */}
          <circle cx="0" cy="0" r="54" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
          <circle cx="0" cy="0" r="48" fill="url(#sphereCore)" filter="url(#glowEffect)" opacity="0.6" />
          
          {/* Grid lines inside sphere */}
          <ellipse cx="0" cy="0" rx="46" ry="16" fill="none" stroke="rgba(147, 197, 253, 0.5)" strokeWidth="1" strokeDasharray="2 3" className="sphere-spin-1" />
          <ellipse cx="0" cy="0" rx="18" ry="46" fill="none" stroke="rgba(192, 132, 252, 0.5)" strokeWidth="1" strokeDasharray="3 3" className="sphere-spin-2" />
          <ellipse cx="0" cy="0" rx="46" ry="34" fill="none" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1" />
          
          {/* Constellation Nodes */}
          <circle cx="-20" cy="-15" r="2.5" fill="#38bdf8" />
          <circle cx="18" cy="-10" r="2" fill="#a855f7" />
          <circle cx="-10" cy="22" r="2.5" fill="#60a5fa" />
          <circle cx="24" cy="18" r="2" fill="#c084fc" />
          <circle cx="0" cy="0" r="3" fill="#ffffff" filter="url(#glowEffect)" />
          
          {/* Node interconnect lines */}
          <line x1="-20" y1="-15" x2="0" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="18" y1="-10" x2="0" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="-10" y1="22" x2="0" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="24" y1="18" x2="0" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        </g>
      </svg>

      {/* Floating Badges (Matching Screenshot Layout) */}
      <div className="hero-floating-pill pill-literature">
        <BookOpen size={13} className="pill-icon text-cyan" />
        <span>Literature Analysis</span>
      </div>

      <div className="hero-floating-pill pill-multiagent">
        <Network size={13} className="pill-icon text-purple" />
        <span>Multi-Agent</span>
      </div>

      <div className="hero-floating-pill pill-rag">
        <Database size={13} className="pill-icon text-blue" />
        <span>RAG + Search</span>
      </div>

      <div className="hero-floating-pill pill-hitl">
        <ShieldCheck size={13} className="pill-icon text-indigo" />
        <span>Human-in-the-Loop</span>
      </div>
    </div>
  )
}
