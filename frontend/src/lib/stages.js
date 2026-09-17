/**
 * Pipeline stage map
 * -------------------
 * Mirrors src/Graph/graph_builder.py's node sequence.
 * 15 Autonomous Agents with Subsystem Architecture & Realism Metadata.
 */
import {
  Compass, Lightbulb, CheckCircle2, BookOpen, ShieldCheck, SearchCode,
  FileText, ListChecks, Gauge, FlaskConical, PlayCircle, BarChart3,
  FileEdit, Award, HelpCircle,
} from 'lucide-react'

export const STAGES = [
  { key: 'router_agent', label: 'Routing', icon: Compass },
  { key: 'clarification_agent', label: 'Clarification', icon: HelpCircle },
  { key: 'idea_generator', label: 'Idea Generation', icon: Lightbulb },
  { key: 'auto_select_topic', label: 'Topic Selection', icon: Lightbulb },
  { key: 'human_topic_approval', label: 'Topic Approval', icon: CheckCircle2 },
  { key: 'literature_review_agent', label: 'Literature Review', icon: BookOpen },
  { key: 'citation_validator', label: 'Citation Check', icon: ShieldCheck },
  { key: 'gap_finder', label: 'Gap Analysis', icon: SearchCode },
  { key: 'human_gap_approval', label: 'Gap Approval', icon: CheckCircle2 },
  { key: 'proposal_writer', label: 'Proposal Writing', icon: FileText },
  { key: 'methodology_designer', label: 'Methodology Design', icon: ListChecks },
  { key: 'feasibility_reviewer', label: 'Feasibility Review', icon: Gauge },
  { key: 'experiment_planner', label: 'Experiment Planning', icon: FlaskConical },
  { key: 'experiment_executor', label: 'Experiment Execution', icon: PlayCircle },
  { key: 'results_evaluator', label: 'Results Evaluation', icon: BarChart3 },
  { key: 'report_writer', label: 'Report Writing', icon: FileEdit },
  { key: 'human_final_review', label: 'Final Review', icon: Award },
]

export const DISPLAY_STAGES = [
  {
    key: 'router_agent',
    num: '01',
    label: 'Routing',
    subsystem: 'Intent Classifier',
    phaseId: 'phase-1',
    phaseTitle: 'Phase 1 · Inception & Scoping',
    estTime: '~2s',
    icon: Compass,
    isHuman: false,
    desc: 'Analyzes intent, detects research domain, and verifies topic prerequisites.',
  },
  {
    key: 'ideation',
    num: '02',
    label: 'Ideation',
    subsystem: 'Candidate Discovery',
    phaseId: 'phase-1',
    phaseTitle: 'Phase 1 · Inception & Scoping',
    estTime: '~6s',
    icon: Lightbulb,
    matches: ['clarification_agent', 'idea_generator', 'auto_select_topic'],
    isHuman: false,
    desc: 'Generates candidate FYP ideas or enriches user topic with feasibility scores.',
  },
  {
    key: 'human_topic_approval',
    num: '03',
    label: 'Topic Approval',
    subsystem: 'Human Gatekeeper',
    phaseId: 'phase-1',
    phaseTitle: 'Phase 1 · Inception & Scoping',
    estTime: 'Action Req.',
    icon: CheckCircle2,
    isHuman: true,
    desc: 'Interactive human checkpoint: review and approve candidate topic.',
  },
  {
    key: 'literature_review_agent',
    num: '04',
    label: 'Literature Review',
    subsystem: 'ArXiv & Scholar Scout',
    phaseId: 'phase-2',
    phaseTitle: 'Phase 2 · Literature & Rigor',
    estTime: '~14s',
    icon: BookOpen,
    isHuman: false,
    desc: 'Queries Semantic Scholar and Tavily for high-impact papers.',
  },
  {
    key: 'citation_validator',
    num: '05',
    label: 'Citation Check',
    subsystem: 'DOI & Integrity Audit',
    phaseId: 'phase-2',
    phaseTitle: 'Phase 2 · Literature & Rigor',
    estTime: '~4s',
    icon: ShieldCheck,
    isHuman: false,
    desc: 'Flags broken links, duplicates, and verifies citations.',
  },
  {
    key: 'gap_finder',
    num: '06',
    label: 'Gap Analysis',
    subsystem: 'Literature Gap Miner',
    phaseId: 'phase-2',
    phaseTitle: 'Phase 2 · Literature & Rigor',
    estTime: '~8s',
    icon: SearchCode,
    isHuman: false,
    desc: 'Identifies concrete research gaps from published literature.',
  },
  {
    key: 'human_gap_approval',
    num: '07',
    label: 'Gap Approval',
    subsystem: 'Human Gatekeeper',
    phaseId: 'phase-2',
    phaseTitle: 'Phase 2 · Literature & Rigor',
    estTime: 'Action Req.',
    icon: CheckCircle2,
    isHuman: true,
    desc: 'Interactive human checkpoint: confirm research gaps to pursue.',
  },
  {
    key: 'proposal_writer',
    num: '08',
    label: 'Proposal Writing',
    subsystem: 'Problem Formulation',
    phaseId: 'phase-3',
    phaseTitle: 'Phase 3 · Architecture & Feasibility',
    estTime: '~10s',
    icon: FileText,
    isHuman: false,
    desc: 'Drafts executive summary, problem formulation, and aims.',
  },
  {
    key: 'methodology_designer',
    num: '09',
    label: 'Methodology Design',
    subsystem: 'Algorithmic Pipeline',
    phaseId: 'phase-3',
    phaseTitle: 'Phase 3 · Architecture & Feasibility',
    estTime: '~8s',
    icon: ListChecks,
    isHuman: false,
    desc: 'Designs ordered, executable methodology steps and tech stack.',
  },
  {
    key: 'feasibility_reviewer',
    num: '10',
    label: 'Feasibility Review',
    subsystem: 'Compute Viability Audit',
    phaseId: 'phase-3',
    phaseTitle: 'Phase 3 · Architecture & Feasibility',
    estTime: '~4s',
    icon: Gauge,
    isHuman: false,
    desc: 'Automated audit of compute demands and 1-year FYP viability.',
  },
  {
    key: 'experiment_planner',
    num: '11',
    label: 'Experiment Planning',
    subsystem: 'Datasets & Benchmarks',
    phaseId: 'phase-3',
    phaseTitle: 'Phase 3 · Architecture & Feasibility',
    estTime: '~6s',
    icon: FlaskConical,
    isHuman: false,
    desc: 'Specifies benchmark datasets, evaluation metrics, and baselines.',
  },
  {
    key: 'experiment_executor',
    num: '12',
    label: 'Experiment Execution',
    subsystem: 'Dry-Run Simulation',
    phaseId: 'phase-4',
    phaseTitle: 'Phase 4 · Empirical & Synthesis',
    estTime: '~5s',
    icon: PlayCircle,
    isHuman: false,
    desc: 'Executes simulated experimental runs to test the design.',
  },
  {
    key: 'results_evaluator',
    num: '13',
    label: 'Results Evaluation',
    subsystem: 'Empirical Benchmark',
    phaseId: 'phase-4',
    phaseTitle: 'Phase 4 · Empirical & Synthesis',
    estTime: '~5s',
    icon: BarChart3,
    isHuman: false,
    desc: 'Evaluates empirical results against baseline criteria.',
  },
  {
    key: 'report_writer',
    num: '14',
    label: 'Report Writing',
    subsystem: 'IEEE LaTeX/MD Synthesis',
    phaseId: 'phase-4',
    phaseTitle: 'Phase 4 · Empirical & Synthesis',
    estTime: '~16s',
    icon: FileEdit,
    isHuman: false,
    desc: 'Compiles full academic FYP proposal in IEEE format.',
  },
  {
    key: 'human_final_review',
    num: '15',
    label: 'Final Review',
    subsystem: 'Human Gatekeeper',
    phaseId: 'phase-4',
    phaseTitle: 'Phase 4 · Empirical & Synthesis',
    estTime: 'Action Req.',
    icon: Award,
    isHuman: true,
    desc: 'Final human inspection checkpoint: review proposal & export.',
  },
]

/** 0-1 fraction of the pipeline completed, for the sidebar progress ring. */
export function stageProgress(trace) {
  const idx = currentStageIndex(trace)
  if (idx === -1) return 0
  return Math.min((idx) / DISPLAY_STAGES.length, 1)
}

/** Returns the index into DISPLAY_STAGES that the last trace line belongs to,
 * or -1 if trace is empty / doesn't match anything yet. */
export function currentStageIndex(trace) {
  if (!trace || trace.length === 0) return -1
  for (let i = trace.length - 1; i >= 0; i--) {
    const line = trace[i]
    const agentPrefix = line.split(':')[0].trim()
    const idx = DISPLAY_STAGES.findIndex(
      (s) => s.key === agentPrefix || (s.matches && s.matches.includes(agentPrefix))
    )
    if (idx !== -1) return idx
  }
  return -1
}

/** Human-readable "what's happening right now" label for the thinking
 * indicator, derived from the live trace. */
export function lastTraceLabel(trace) {
  if (!trace || trace.length === 0) return null
  const idx = currentStageIndex(trace)
  if (idx !== -1) return `${DISPLAY_STAGES[idx].label}…`
  return trace[trace.length - 1]
}