// Vercel Serverless Function to proxy Groq API calls
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Check if API key is available
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('GROQ_API_KEY environment variable not set')
      res.status(500).json({ 
        error: 'API key not configured',
        message: 'GROQ_API_KEY environment variable is missing'
      })
      return
    }

    const { messages, model = 'llama3-8b-8192', temperature = 0.7, max_tokens = 1000 } = req.body

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid request: messages array required' })
      return
    }

    console.log('Making Groq API request with model:', model)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        max_tokens,
        top_p: 1,
        stream: false
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', response.status, errorText)
      
      res.status(response.status).json({ 
        error: `Groq API error: ${response.status}`,
        message: errorText || 'Unknown error from Groq API'
      })
      return
    }

    const data = await response.json()
    console.log('Groq API success, returning response')
    res.status(200).json(data)

  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}