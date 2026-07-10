const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8080;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/login', async (req, res) => {
  try {
    const gatewayResponse = await fetch(`${GATEWAY_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const body = await gatewayResponse.json();
    res.status(gatewayResponse.status).json(body);
  } catch (err) {
    res.status(502).json({ success: false, message: 'Gateway unavailable' });
  }
});

app.get('/api/accounts/:username/balance', async (req, res) => {
  try {
    const gatewayResponse = await fetch(
      `${GATEWAY_URL}/accounts/${encodeURIComponent(req.params.username)}/balance`
    );
    const body = await gatewayResponse.json();
    res.status(gatewayResponse.status).json(body);
  } catch (err) {
    res.status(502).json({ message: 'Gateway unavailable' });
  }
});

app.post('/api/transfer', async (req, res) => {
  try {
    const gatewayResponse = await fetch(`${GATEWAY_URL}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const body = await gatewayResponse.json();
    res.status(gatewayResponse.status).json(body);
  } catch (err) {
    res.status(502).json({ success: false, message: 'Gateway unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`Frontend listening on port ${PORT}`);
});
