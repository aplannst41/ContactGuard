const API_URL = 'https://contact-guard.vercel.app';

/**
 * Clean phone query utility to normalize space & dashes
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  let normalized = phone.trim().replace(/[\s-]/g, '');
  if (normalized.startsWith('0')) {
    normalized = '+62' + normalized.slice(1);
  } else if (normalized.length > 0 && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  return normalized;
};

/**
 * Search contact information by phone number
 */
export async function searchPhoneNumber(phone) {
  const normalized = normalizePhone(phone);
  const response = await fetch(`${API_URL}/api/search?phone=${encodeURIComponent(normalized)}`);
  if (!response.ok) {
    throw new Error('Gagal memuat data pencarian');
  }
  return await response.json();
}

/**
 * Add a name tag suggestion to a phone number
 */
export async function addTagName({ phone, name, uploader }) {
  const normalized = normalizePhone(phone);
  const response = await fetch(`${API_URL}/api/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: normalized,
      name: name.trim(),
      uploader: uploader || 'Anonim',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Terjadi kesalahan saat menambah tag');
  }
  return data;
}

/**
 * Report a phone number as spam/scam
 */
export async function reportSpam({ phone, reason, reporter }) {
  const normalized = normalizePhone(phone);
  const response = await fetch(`${API_URL}/api/spam-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: normalized,
      reason: reason.trim(),
      reporter: reporter || 'Anonim',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Terjadi kesalahan saat melaporkan spam');
  }
  return data;
}

/**
 * Fetch visitor log and tag list for my own phone number
 */
export async function fetchMyTagsAndVisitors(phone) {
  const normalized = normalizePhone(phone);
  const response = await fetch(`${API_URL}/api/my-tags?phone=${encodeURIComponent(normalized)}`);
  if (!response.ok) {
    throw new Error('Gagal memuat daftar tag Anda');
  }
  return await response.json();
}

/**
 * Sync local address book contacts with crowdsourcing API
 */
export async function syncContacts({ contacts, uploaderName }) {
  const response = await fetch(`${API_URL}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contacts,
      uploaderName: uploaderName || 'Anonim',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Gagal menyinkronkan kontak');
  }
  return data;
}
