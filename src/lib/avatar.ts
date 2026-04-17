function sanitize(value: string): string {
  return value.trim();
}

export function getInitials(
  firstName: string,
  lastName: string,
  email?: string
): string {
  const first = sanitize(firstName);
  const last = sanitize(lastName);

  if (first || last) {
    return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || "U";
  }

  if (email) {
    return sanitize(email).slice(0, 2).toUpperCase() || "U";
  }

  return "U";
}

function colorFromSeed(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 42%)`;
}

export function createFallbackAvatarDataUrl(
  firstName: string,
  lastName: string,
  email?: string
): string {
  const initials = getInitials(firstName, lastName, email);
  const seed = `${firstName}:${lastName}:${email ?? ""}`;
  const fill = colorFromSeed(seed);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='64' fill='${fill}'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-size='46' font-weight='700'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
