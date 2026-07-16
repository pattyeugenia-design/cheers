// Hashea un secreto (SHA-256) para no guardar el password en texto plano en la cookie.
// Usa Web Crypto (crypto.subtle), disponible tanto en Node.js (18+) como en el runtime de Edge (middleware).
export async function hashAdminSecret(value: string): Promise<string> {
  const enc = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}
