const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-License-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, webhookId } = req.body;

  try {
    // Initialize global store if needed
    global.webhookEndpoints = global.webhookEndpoints || new Map();

    if (action === 'create_endpoint') {
      const endpointId = crypto.randomBytes(8).toString('hex');
      const endpoint = {
        id: endpointId,
        url: `/api/webhook/${endpointId}`,
        createdAt: new Date().toISOString(),
        receivedWebhooks: [],
        isActive: true
      };

      global.webhookEndpoints.set(endpointId, endpoint);

      return res.status(201).json({
        success: true,
        endpoint: {
          id: endpoint.id,
          url: endpoint.url,
          fullUrl: `${req.headers.host || 'your-site.com'}${endpoint.url}`,
          createdAt: endpoint.createdAt
        }
      });
    }

    if (action === 'get_endpoint' && webhookId) {
      const endpoint = global.webhookEndpoints.get(webhookId);

      if (!endpoint) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      return res.status(200).json({
        success: true,
        endpoint: endpoint
      });
    }

    if (action === 'list_endpoints') {
      const endpoints = Array.from(global.webhookEndpoints.values());

      return res.status(200).json({
        success: true,
        endpoints: endpoints.map(e => ({
          id: e.id,
          url: e.url,
          createdAt: e.createdAt,
          webhookCount: e.receivedWebhooks.length
        }))
      });
    }

    return res.status(400).json({
      error: 'Invalid action',
      validActions: ['create_endpoint', 'get_endpoint', 'list_endpoints']
    });

  } catch (error) {
    console.error('[PROCESS ERROR]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};