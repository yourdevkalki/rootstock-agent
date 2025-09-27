import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${path}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }
    return response.json();
  } catch (error) {
    console.error(`API Fetch Error: ${error}`);
    throw error;
  }
}
