// URL + contact normalization. The #1 cause of "broken" Website/LinkedIn
// buttons is a stored value WITHOUT a protocol ("company.com",
// "www.company.com", "linkedin.com/company/x"). Used directly in an <a href>,
// the browser treats it as a RELATIVE path and navigates inside the SPA →
// blank screen / "Page Not Found". Normalizing to an absolute https URL fixes it.

const EMPTY = new Set(["", "-", "--", "n/a", "na", "none", "null", "undefined", "pending"]);

export function normalizeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (EMPTY.has(s.toLowerCase())) return null;
  if (/^https?:\/\//i.test(s)) return s;        // already absolute
  if (/^\/\//.test(s)) return "https:" + s;     // protocol-relative
  s = s.replace(/^\/+/, "");                     // strip leading slashes (relative)
  if (!/[.]/.test(s)) return null;               // not a domain-looking string
  return "https://" + s;
}

/** Open a normalized URL in a new tab. No-op for invalid URLs. */
export function openExternal(raw?: string | null): void {
  const url = normalizeUrl(raw);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function normalizeEmail(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim().replace(/^mailto:/i, "");
  return EMAIL_RE.test(s) ? s : null;
}

/** Phone normalized to a tel: friendly string (keeps leading +, digits). */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (EMPTY.has(s.toLowerCase())) return null;
  const tel = s.replace(/[^\d+]/g, "");
  return tel.replace(/\+/g, "").length >= 6 ? s : null;
}
export function telHref(raw?: string | null): string {
  return "tel:" + String(raw ?? "").replace(/[^\d+]/g, "");
}
