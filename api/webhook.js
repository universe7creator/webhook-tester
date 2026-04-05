const crypto = require('crypto');

// In-memory store for webhook endpoints (in production, use a database)
const endpoints = new Map();

// Generate unique endpoint ID
function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlParts = req.url.split('/');
  const webhookId = urlParts[2] || urlParts[1];

  // GET /api/webhook or /api/webhook/<id> - List or get specific endpoint
  if (req.method === 'GET') {
    if (webhookId && webhookId !== 'webhook') {
      const endpoint = endpoints.get(webhookId);
      if (!endpoint) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      return res.status(200).json(endpoint);
    }

    // List all endpoints
    const allEndpoints = Array.from(endpoints.values());
    return res.status(200).json({
      endpoints: allEndpoints,
      count: allEndpoints.length
    });
  }

  // POST /api/webhook - Create new endpoint
  if (req.method === 'POST' && !webhookId) {
    const id = generateId();
    const endpoint = {
      id,
      url: `/api/webhook/${id}`,
      createdAt: new Date().toISOString(),
      receivedWebhooks: [],
      isActive: true
    };
    endpoints.set(id, endpoint);
    return res.status(201).json(endpoint);
  }

  // POST /api/webhook/<id> - Receive webhook for specific endpoint
  if (req.method === 'POST' && webhookId) {
    const endpoint = endpoints.get(webhookId);
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    const webhookData = {
      id: generateId(),
      receivedAt: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      query: req.query,
      ip: req.ip || req.connection?.remoteAddress
    };

    endpoint.receivedWebhooks.unshift(webhookData);
    // Keep only last 50 webhooks
    if (endpoint.receivedWebhooks.length > 50) {
      endpoint.receivedWebhooks.pop();
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook received',
      webhookId: webhookData.id
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};