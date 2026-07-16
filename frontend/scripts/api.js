/**
 * api.js — Central API utility for NutriAI frontend
 * ─────────────────────────────────────────────────
 * Single source of truth for the backend base URL.
 *
 * How it works:
 *   • Local dev  : VITE_API_BASE is empty (frontend/.env.local overrides it)
 *                  → all /api/... calls go to Vite proxy → Express 8787 → FastAPI
 *   • Production : VITE_API_BASE = https://nutri-ai-p0yi.onrender.com
 *                  → all calls go directly to the Render backend
 *
 * Usage:
 *   import { apiFetch, apiUrl } from '../scripts/api'
 *
 *   // Simple GET
 *   const data = await apiFetch('/auth/login', { method: 'POST', body: ... })
 *
 *   // Build a URL (e.g. for query strings)
 *   const url = apiUrl('/diet/calorie-stats')
 */

const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

/**
 * Build a full URL for the given API path.
 * @param {string} path  - must start with /  e.g. '/auth/login'
 * @returns {string}
 */
export function apiUrl(path) {
  if (BASE) {
    // Production: direct to Render — FastAPI routes don't have /api/ prefix
    // Strip /api prefix if present so we call /auth/login not /api/auth/login
    const cleanPath = path.replace(/^\/api/, '')
    return `${BASE}${cleanPath}`
  }
  // Local dev: relative URL proxied by Vite → Express → FastAPI
  return path
}

/**
 * Fetch wrapper that automatically resolves the correct base URL.
 * Accepts the same options as window.fetch plus a convenience `token` field.
 *
 * @param {string} path     - API path, e.g. '/api/auth/login' or '/auth/login'
 * @param {object} options  - fetch options + optional `token` string
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  const { token, headers = {}, ...rest } = options

  const resolvedHeaders = { ...headers }
  if (token) {
    resolvedHeaders['Authorization'] = `Bearer ${token}`
  }
  if (rest.body && typeof rest.body === 'object' && !resolvedHeaders['Content-Type']) {
    resolvedHeaders['Content-Type'] = 'application/json'
    rest.body = JSON.stringify(rest.body)
  }

  return fetch(apiUrl(path), { headers: resolvedHeaders, ...rest })
}

/**
 * Convenience: GET with auth token, returns parsed JSON.
 */
export async function apiGet(path, token) {
  const res = await apiFetch(path, { token })
  return res.json()
}

/**
 * Convenience: POST with auth token and JSON body, returns parsed JSON.
 */
export async function apiPost(path, body, token) {
  const res = await apiFetch(path, {
    method: 'POST',
    body,
    token,
  })
  return res.json()
}

/**
 * Convenience: PUT with auth token and JSON body, returns parsed JSON.
 */
export async function apiPut(path, body, token) {
  const res = await apiFetch(path, {
    method: 'PUT',
    body,
    token,
  })
  return res.json()
}
