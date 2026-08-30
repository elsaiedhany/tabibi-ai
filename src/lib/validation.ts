export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  // Validates international/local phone formats (e.g. +201012345678 or 201012345678)
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return phoneRegex.test(phone.trim());
}

export function isValidUuid(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
}

export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== "string") return "";
  return text.trim().slice(0, maxLength);
}

export function isValidPrice(price: any): boolean {
  const p = parseFloat(price);
  return !isNaN(p) && p >= 0 && p <= 100000;
}
