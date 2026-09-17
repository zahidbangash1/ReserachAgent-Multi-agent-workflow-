/**
 * API Client
 * -----------
 * Thin wrapper around the FastAPI backend (api/main.py). Mirrors the
 * backend's own services/ pattern — every component calls THIS, not fetch()
 * directly, so the endpoint contract lives in exactly one place.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function handleResponse(response) {
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new Error(`API error ${response.status}: ${detail}`)
  }
  return response.json()
}

export async function startSession(userQuery) {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_query: userQuery }),
  })
  return handleResponse(response)
}

export async function resumeSession(threadId, resumePayload) {
  const response = await fetch(`${API_URL}/sessions/${threadId}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_payload: resumePayload }),
  })
  return handleResponse(response)
}

export async function getSession(threadId) {
  const response = await fetch(`${API_URL}/sessions/${threadId}`)
  return handleResponse(response)
}

export async function getSearchHistory(limit = 50) {
  const response = await fetch(`${API_URL}/searches?limit=${limit}`)
  return handleResponse(response)
}

export async function getSearchDetails(threadId) {
  const response = await fetch(`${API_URL}/searches/${threadId}`)
  return handleResponse(response)
}


/**
 * Consumes an NDJSON streaming response (one JSON object per line) from
 * /sessions/stream or /sessions/{id}/resume/stream, calling onEvent for
 * each parsed event as it arrives. Not full SSE (no "data:" framing) —
 * EventSource can't send a POST body, which these routes need
 * (user_query / resume_payload), so this reads the fetch() response body
 * directly via its ReadableStream instead.
 *
 * Event shapes (mirrors api/graph_service.py's _stream_and_finish):
 *   {type: 'started', thread_id}
 *   {type: 'node_update', node, status, trace}
 *   {type: 'error', message}
 *   {type: 'done', session: SessionResponse}
 */
async function consumeNdjson(response, onEvent) {
  if (!response.ok || !response.body) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // not JSON — keep statusText
    }
    throw new Error(`API error ${response.status}: ${detail}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newlineIdx
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim()
      buffer = buffer.slice(newlineIdx + 1)
      if (line) onEvent(JSON.parse(line))
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer.trim()))
}

export async function streamStartSession(userQuery, onEvent) {
  const response = await fetch(`${API_URL}/sessions/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_query: userQuery }),
  })
  await consumeNdjson(response, onEvent)
}

export async function streamResumeSession(threadId, resumePayload, onEvent) {
  const response = await fetch(`${API_URL}/sessions/${threadId}/resume/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_payload: resumePayload }),
  })
  await consumeNdjson(response, onEvent)
}