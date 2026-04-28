// API client for the GP Restaurant backend (FastAPI at http://localhost:8000)
// All endpoints documented at http://localhost:8000/docs

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// ── Workspace user (temporary thesis-testing partitioning) ──────────────
// Each teammate picks their own workspace via the sidebar switcher. The
// chosen user id is sent on every request as X-User-Id so the backend
// isolates uploads/forecasts per person. This is a testing-only mechanism
// and will be replaced with real auth later.
const USER_ID_KEY = 'gp.workspace.userId';

export function getWorkspaceUserId() {
  const v = localStorage.getItem(USER_ID_KEY);
  return v ? Number(v) : null;
}

export function setWorkspaceUserId(id) {
  if (id == null) localStorage.removeItem(USER_ID_KEY);
  else localStorage.setItem(USER_ID_KEY, String(id));
}

async function request(path, { method = 'GET', body = null } = {}) {
  const init = { method, headers: {} };
  const userId = getWorkspaceUserId();
  if (userId) init.headers['X-User-Id'] = String(userId);
  if (body instanceof FormData) {
    init.body = body;
  } else if (body) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const message = typeof detail === 'string' ? detail : detail?.message ?? `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return data;
}

// ── Workspace ──────────────────────────────────────────────────────────
export function fetchWorkspaceUsers() {
  return request('/api/workspace/users');
}

// ── Dashboard ──────────────────────────────────────────────────────────
export function fetchDashboard({ startDate, endDate, category } = {}) {
  const qs = new URLSearchParams();
  if (startDate) qs.set('start_date', startDate);
  if (endDate) qs.set('end_date', endDate);
  if (category && category !== 'All' && category !== 'all') qs.set('category', category);
  const q = qs.toString();
  return request(`/api/dashboard${q ? '?' + q : ''}`);
}

// ── Menu Engineering ───────────────────────────────────────────────────
export function fetchMenuEngineering({ startDate, endDate } = {}) {
  const qs = new URLSearchParams();
  if (startDate) qs.set('start_date', startDate);
  if (endDate) qs.set('end_date', endDate);
  const q = qs.toString();
  return request(`/api/menu-engineering${q ? '?' + q : ''}`);
}

// What-If simulator — new_cost is optional
export function simulateWhatIf({ target, newPrice, newCost = null }) {
  const qs = new URLSearchParams({ target, new_price: String(newPrice) });
  if (newCost !== null && newCost !== undefined && !Number.isNaN(newCost)) {
    qs.set('new_cost', String(newCost));
  }
  return request(`/api/menu-engineering/simulate?${qs}`);
}

// ── Forecasting ────────────────────────────────────────────────────────
// Each accepts optional { startDate, endDate } — when both are provided,
// the backend slices the pre-trained 365-day forecast to that window so
// dates like "April 17–22" actually return April predictions (rather than
// a N-day forecast starting from the end of the training data).
export function fetchForecastTotal(period = 7, { startDate, endDate } = {}) {
  const qs = new URLSearchParams({ period: String(period) });
  if (startDate) qs.set('start_date', startDate);
  if (endDate)   qs.set('end_date', endDate);
  return request(`/api/forecast/total?${qs}`);
}

export function fetchForecastItem(target, period = 7, { startDate, endDate } = {}) {
  const qs = new URLSearchParams({ target, period: String(period) });
  if (startDate) qs.set('start_date', startDate);
  if (endDate)   qs.set('end_date', endDate);
  return request(`/api/forecast/item?${qs}`);
}

export function fetchForecastCategory(target, period = 7, { startDate, endDate } = {}) {
  const qs = new URLSearchParams({ target, period: String(period) });
  if (startDate) qs.set('start_date', startDate);
  if (endDate)   qs.set('end_date', endDate);
  return request(`/api/forecast/category?${qs}`);
}

// ── Reference ──────────────────────────────────────────────────────────
export function fetchCategories() {
  return request('/api/categories');
}

export function fetchProducts(category = null) {
  const qs = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/api/products${qs}`);
}

// ── Upload ─────────────────────────────────────────────────────────────
// replaceAll=true wipes the database before importing (useful for testing
// with an isolated dataset). Default false = incremental upload.
export async function uploadFile(file, { replaceAll = false } = {}) {
  const fd = new FormData();
  fd.append('file', file);
  const qs = replaceAll ? '?replace_all=true' : '';
  return request(`/api/upload${qs}`, { method: 'POST', body: fd });
}

// ── Upload history / management ────────────────────────────────────────
export function listUploads() {
  return request('/api/uploads');
}

export function deleteUpload(id) {
  return request(`/api/uploads/${id}`, { method: 'DELETE' });
}

export function clearAllData() {
  return request('/api/data', { method: 'DELETE' });
}

// ── Health ─────────────────────────────────────────────────────────────
export function fetchHealth() {
  return request('/api/health');
}

// ── Data range ─────────────────────────────────────────────────────────
// Returns { hasData, earliest, latest, totalDays, totalRows, uniqueOrders,
//           forecastStart, forecastEndMax, forecastMaxDays }
export function fetchDataRange() {
  return request('/api/data-range');
}
