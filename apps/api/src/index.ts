import express from 'express';

const app = express();
const port = 3000;

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
  });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});