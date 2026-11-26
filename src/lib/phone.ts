/**
 * Turn a typed phone number into international format (+961…).
 * Local Lebanese numbers (7–8 digits, with or without a leading 0) get +961.
 * Returns null when the number cannot be valid.
 */
export function normalizePhone(value: string): string | null {
  if (value.length > 40 || !/^[+0-9()\s.-]+$/.test(value)) {
    return null;
  }

  let phone = value.replace(/[()\s.-]/g, "");

  if (phone.startsWith("00")) {
    phone = `+${phone.slice(2)}`;
  } else if (!phone.startsWith("+")) {
    if (!/^\d{7,8}$/.test(phone)) return null;

    if (phone.startsWith("0")) {
      phone = phone.slice(1);
    }

    phone = `+961${phone}`;
  }

  return /^\+[1-9]\d{6,14}$/.test(phone) ? phone : null;
}

/** First name for friendly WhatsApp greetings. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

/** A wa.me link with the message already typed in. */
export function whatsAppLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
