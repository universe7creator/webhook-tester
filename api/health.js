module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'ok',
    service: 'webhook-tester',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};