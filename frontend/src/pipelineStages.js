/**
 * Fallback loading hints
 * ------------------------
 * The real per-agent tracker lives in lib/stages.js, driven by live
 * node_update events streamed from the backend (see api/client.js's
 * streamStartSession/streamResumeSession). This file covers only the brief
 * gap before the first event arrives — cycling generic text so the UI never
 * looks frozen even for that first moment.
 */
export const FALLBACK_HINTS = ['Contacting the pipeline…', 'Warming up…']