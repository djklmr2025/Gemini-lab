const express = require('express');
const path = require('path');
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

app.get('*', (req, res) => {
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
