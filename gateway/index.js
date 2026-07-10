const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:8081';

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/login', async (req, res) => {
  try {
    const authResponse = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const body = await authResponse.json();
    res.status(authResponse.status).json(body);
  } catch (err) {
    res.status(502).json({ success: false, message: 'Auth service unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`Gateway listening on port ${PORT}`);
});
