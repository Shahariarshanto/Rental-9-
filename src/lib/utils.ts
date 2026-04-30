import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Normalizes and formats a phone number for Bangladesh (+880)
 * Handles: removing non-numerics, leading 0s, and ensuring 880 prefix
 */
export function formatPhoneNumber(phone: string, type: 'tel' | 'wa' = 'tel'): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle +880 or 880 prefix already present
  if (cleaned.startsWith('880')) {
    // Already has 880, do nothing
  } else if (cleaned.startsWith('0')) {
    // If starts with 0 (e.g. 017...), remove 0 and prepend 880
    cleaned = '880' + cleaned.substring(1);
  } else if (cleaned.startsWith('1')) {
    // If starts with 1 (e.g. 17...), prepend 880
    cleaned = '880' + cleaned;
  }

  if (type === 'wa') {
    return `https://wa.me/${cleaned}`;
  }
  return `tel:+${cleaned}`;
}
