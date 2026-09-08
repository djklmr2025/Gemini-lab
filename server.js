const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.join(__dirname, '.env'))) {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
  });
}
const express = require('express');
const { pathToFileURL } = require('url');

const app = express();
const port = Number(process.env.PORT || 3001);
const distDir = path.join(__dirname, 'dist');
const staticDir = require('fs').existsSync(distDir) ? distDir : __dirname;
const indexFile = path.join(staticDir, 'index.html');
const eduAgentModuleUrl = pathToFileURL(path.join(__dirname, 'api', 'edu-agent.js')).href;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(staticDir));

app.options('/api/edu-agent', (req, res) => res.status(200).end());
app.all('/api/edu-agent', async (req, res, next) => {
  try {
    const module = await import(eduAgentModuleUrl);
    const handler = module.default;
    return handler(req, res);
  } catch (error) {
    return next(error);
  }
});

app.options('/api/chat', (req, res) => res.status(200).end());
app.all('/api/chat', async (req, res, next) => {
  try {
    const handler = require('./api/chat.js');
    return handler(req, res);
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.sendFile(indexFile);
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Internal server error', details: error.message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Serving static files from ${staticDir}`);
});
