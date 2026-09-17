import { useEffect, useRef, useState } from 'react'

const STAGE_NAMES = [
  'Intent Scoping', 'Ideation', 'Topic Gate', 'Lit Review', 'DOI Audit',
  'Gap Miner', 'Proposal Arch', 'Methodology', 'Simulation', 'IEEE Report'
]

export default function HeroDiagram() {
  const svgRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STAGE_NAMES.length)
    }, 850)
    return () => clearInterval(interval)
  }, [])

  const w = 760, h = 88, pad = 48
  const step = (w - pad * 2) / (STAGE_NAMES.length - 1)
  const points = STAGE_NAMES.map((name, i) => ({
    name,
    x: pad + i * step,
    y: h / 2 + (i % 2 === 0 ? -11 : 11),
  }))

  return (
    <div className="hero-diagram" aria-hidden="true">
      <div className="hero-diagram-ambient" />
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="heroActiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="linkTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.2)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.2)" />
          </linearGradient>

          <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Inactive Links */}
        {points.slice(1).map((p, i) => (
          <line
            key={`track-${i}`}
            className="hero-link-track"
            x1={points[i].x}
            y1={points[i].y}
            x2={p.x}
            y2={p.y}
          />
        ))}

        {/* Dynamic Glowing Links */}
        {points.slice(1).map((p, i) => {
          const isTraversed = i < activeStep
          return (
            <line
              key={`active-${i}`}
              className={`hero-link ${isTraversed ? 'on' : ''}`}
              x1={points[i].x}
              y1={points[i].y}
              x2={p.x}
              y2={p.y}
              stroke="url(#heroActiveGrad)"
              filter={isTraversed ? 'url(#heroGlow)' : undefined}
            />
          )
        })}

        {/* Traveling Signal Pulse Packet */}
        {activeStep > 0 && activeStep < points.length && (
          <circle
            className="hero-pulse-packet"
            cx={points[activeStep].x}
            cy={points[activeStep].y}
            r="4.5"
            fill="#06b6d4"
            filter="url(#heroGlow)"
          />
        )}

        {/* Nodes & Labels */}
        {points.map((p, i) => {
          const isPassed = i <= activeStep
          const isCurrent = i === activeStep

          return (
            <g key={i} className={`hero-node-group ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
              {/* Outer Glow Halo */}
              {isPassed && (
                <circle
                  className="hero-node-aura"
                  cx={p.x}
                  cy={p.y}
                  r="13"
                />
              )}

              {/* Core Node Circle */}
              <circle
                className={`hero-node ${isPassed ? 'on' : ''}`}
                cx={p.x}
                cy={p.y}
                r={isCurrent ? 7 : 5.5}
              />

              {/* Inner White Dot on Active */}
              {isPassed && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="2"
                  fill="#ffffff"
                />
              )}

              {/* Stage Micro-Label */}
              <text
                className={`hero-node-label ${isPassed ? 'on' : ''}`}
                x={p.x}
                y={p.y > h / 2 ? p.y + 18 : p.y - 12}
                textAnchor="middle"
              >
                {p.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}