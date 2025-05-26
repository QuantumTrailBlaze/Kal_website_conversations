import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number, decimalPoint: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimalPoint < 0 ? 0 : decimalPoint;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  // Handle cases where bytes might be less than 1 (e.g., from an erroneous API response or calculation)
  if (bytes < 0) return 'Invalid size'; 
  if (bytes < 1 && bytes > 0) return bytes.toFixed(dm) + ' Bytes'; // For very small positive numbers

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Ensure 'i' is within the bounds of the 'sizes' array
  if (i >= sizes.length) {
    // If the size is extremely large, default to YB or handle as an error/special case
    return parseFloat((bytes / Math.pow(k, sizes.length - 1)).toFixed(dm)) + ' ' + sizes[sizes.length - 1];
  }
  if (i < 0) { // Should not happen with positive bytes and log, but as a safeguard
    return 'Invalid size calculation';
  }

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatRelativeDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  // For older dates, you might want to show the actual date
  // For simplicity, let's show weeks for a bit longer
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  // Default to a simple date format if older than a few weeks
  return date.toLocaleDateString();
}
