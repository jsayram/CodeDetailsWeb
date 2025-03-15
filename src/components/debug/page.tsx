import { useState, useEffect } from 'react';

export default function DebugPage({ token }: { token: string | null }) {

function DebugJwt({ token }: { token: string | null }) {
    const [decodedJwt, setDecodedJwt] = useState<any>(null)
    
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
        <div className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
          <p><strong>sub claim:</strong> {decodedJwt.sub}</p>
          <p><strong>role:</strong> {decodedJwt.role}</p>
          <pre>{JSON.stringify(decodedJwt, null, 2)}</pre>
        </div>
      </details>
    )
  }
  return (
    <div>
        {process.env.NODE_ENV === 'development' && (
          <DebugJwt token={token} />
          )}
    </div>
  )
}
