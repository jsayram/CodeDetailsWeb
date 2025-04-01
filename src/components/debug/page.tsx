// Code: Debug JWT component for debugging JWT tokens
import { useState, useEffect } from 'react';

// component definitions
function DebugJwt({ token }: { token: string | null }) {
  interface JwtPayload {
    sub?: string;
    role?: string;
    exp?: number;
    iat?: number;
    error?: string;
  }
  
  const [decodedJwt, setDecodedJwt] = useState<JwtPayload | null>(null);
  
  useEffect(() => {
    if (!token) return
    
    // Decode JWT (without verification - just for debugging)
    try {
      const parts = token.split('.')
      if (parts.length !== 3) throw new Error('Invalid JWT format')
      
      // Decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1]))
      setDecodedJwt(payload)
    } catch (error) {
      console.error('Error decoding JWT:', error)
      setDecodedJwt({ error: 'Failed to decode token' })
    }
  }, [token])
  
  if (!token || !decodedJwt) return null
  
  return (
    <details className="mt-8 border p-4 rounded">
      <summary>Debug JWT (Developer Only)</summary>
      <div className="mt-2 p-2 rounded overflow-auto">
        <p><strong>sub claim:</strong> {decodedJwt.sub}</p>
        <p><strong>role:</strong> {decodedJwt.role}</p>
        <pre>{JSON.stringify(decodedJwt, null, 2)}</pre>
      </div>
    </details>
  )
}

// Export the inner component for direct use
export { DebugJwt };