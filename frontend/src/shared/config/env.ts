const apiUrl = process.env.NEXT_PUBLIC_API_URL

if (!apiUrl && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL is required in production')
}

export const API_URL = apiUrl ?? 'http://localhost:3001'
