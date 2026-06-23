/** Derive a human-friendly display name from an email address. */
export function displayNameFromEmail(email?: string | null): string {
  if (!email) return "Team Member";
  const local = email.split("@")[0] ?? email;
  const cleaned = local.replace(/[._-]+/g, " ").replace(/\d+/g, "").trim();
  if (!cleaned) return email;
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Two-letter initials for an avatar chip. */
export function initialsFromEmail(email?: string | null): string {
  const name = displayNameFromEmail(email);
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
