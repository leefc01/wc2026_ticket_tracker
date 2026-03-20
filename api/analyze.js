/*
  Vercel Serverless Function — /api/analyze
  ==========================================
  Proxies Claude API calls server-side so the Anthropic API key never
  reaches the browser. Deploy this file at /api/analyze.js in your
  Vercel project root alongside index.html.

  SETUP:
    1. Add ANTHROPIC_API_KEY to Vercel dashboard:
       Project → Settings → Environment Variables → Add
    2. Deploy. The key is injected at runtime, never exposed client-side.

  REQUEST:  POST /api/analyze  { prompt: string }
  RESPONSE: { text: string } or { error: string }

  CommonJS module.exports used (not ESM export default) to match Vercel's
  default Node.js runtime and avoid compilation warnings.
*/

module.exports = async function handler(req, res) {
  /* Only accept POST */
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  /* API key lives in Vercel environment — never sent to browser */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    /* Return just the text content — keeps response minimal */
    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
