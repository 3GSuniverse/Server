// server.js
// Run:
//   npm init -y
//   npm i express
//   node server.js
//
// Then open http://localhost:3000 in your browser.

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------
   Simple HTML home page
   ------------------------------ */
app.get('/', (req, res) => {
  res.type('html').send(`
    <html>
      <head><title>Express GET Playground</title></head>
      <body style="font-family: system-ui, sans-serif; line-height:1.6;">
        <h1>Express GET Playground</h1>
        <p>Try these routes:</p>
        <ul>
          <li><a href="/hello">/hello</a></li>
          <li><a href="/json">/json</a></li>
          <li><a href="/greet?name=YourName">/greet?name=YourName</a></li>
          <li><a href="/user/42">/user/42</a></li>
          <li><a href="/sum/12/30">/sum/12/30</a></li>
          <li><a href="/search/express/routing">/search/express/routing</a></li>
          <li><a href="/redirect">/redirect</a></li>
          <li><a href="/stream">/stream</a></li>
          <li><a href="/multiple-handlers">/multiple-handlers</a></li>
        </ul>
        <p>Open the browser console or network tab to inspect headers and streaming.</p>
      </body>
    </html>
  `);
});

/* ------------------------------
   Plain text response
   ------------------------------ */
app.get('/hello', (req, res) => {
  res.type('text').send('Hello from Express — GET route!');
});

/* ------------------------------
   JSON response
   ------------------------------ */
app.get('/json', (req, res) => {
  res.json({
    service: 'express-get-playground',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/* ------------------------------
   Query parameter example:
   /greet?name=Alice
   ------------------------------ */
app.get('/greet', (req, res) => {
  const name = (req.query.name || 'stranger').toString().slice(0, 100);
  res.type('html').send(`<h2>Hello, ${escapeHtml(name)}!</h2><p>Query: ${JSON.stringify(req.query)}</p>`);
});

/* ------------------------------
   Route parameter:
   /user/:id
   ------------------------------ */
app.get('/user/:id', (req, res) => {
  const id = req.params.id;
  res.json({
    userId: id,
    message: `You requested user ${id}`,
  });
});

/* ------------------------------
   Optional parameter:
   /file or /file/readme
   ------------------------------ */
app.get('/file/:name?', (req, res) => {
  const name = req.params.name || 'index.txt';
  res.type('text').send(`(Simulated file content) name=${name}`);
});

/* ------------------------------
   Wildcard route:
   /search/anything/here
   ------------------------------ */
app.get('/search/*', (req, res) => {
  // req.params[0] contains the wildcard match
  res.json({
    wildcard: req.params[0],
    note: 'Everything after /search/ is treated as a single wildcard parameter.',
  });
});

/* ------------------------------
   Regex route for digits:
   /sum/12/5  -> returns sum
   only matches numbers due to the regex constraint
   ------------------------------ */
app.get('/sum/:a(\\d+)/:b(\\d+)', (req, res) => {
  const a = parseInt(req.params.a, 10);
  const b = parseInt(req.params.b, 10);
  res.json({ a, b, sum: a + b });
});

/* ------------------------------
   Redirect example
   /redirect -> redirects to /hello
   ------------------------------ */
app.get('/redirect', (req, res) => {
  res.redirect(302, '/hello');
});

/* ------------------------------
   Streamed chunked response
   ------------------------------ */
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  // Tell the client this will be chunked:
  res.setHeader('Transfer-Encoding', 'chunked');

  res.write('Starting stream...\n');
  let count = 0;
  const iv = setInterval(() => {
    count += 1;
    if (count <= 5) {
      res.write(`Chunk ${count} at ${new Date().toISOString()}\n`);
    } else {
      clearInterval(iv);
      res.write('Stream complete.\n');
      res.end();
    }
  }, 600);
});

/* ------------------------------
   Simulated delayed response (still GET)
   ------------------------------ */
app.get('/delay', (req, res) => {
  // simulate a slow I/O op
  setTimeout(() => {
    res.json({ msg: 'This response was delayed by 2 seconds' });
  }, 2000);
});

/* ------------------------------
   Echo headers & set a cookie (raw header)
   ------------------------------ */
app.get('/headers', (req, res) => {
  // set a simple cookie without adding dependencies
  res.setHeader('Set-Cookie', `visit=${Date.now()}; HttpOnly; Path=/; Max-Age=60`);
  res.json({
    accepts: req.headers.accept,
    userAgent: req.headers['user-agent'] || null,
    cookiesSet: res.getHeader('Set-Cookie'),
  });
});

/* ------------------------------
   Multiple GET handlers (demonstrates next())
   ------------------------------ */
function loggerMiddleware(req, res, next) {
  console.log(`[LOGGER] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  // attach a value to req for the next handler
  req._start = Date.now();
  next();
}

function finalHandler(req, res) {
  const tookMs = Date.now() - (req._start || Date.now());
  res.json({ route: '/multiple-handlers', elapsedMs: tookMs, hint: 'This used two handlers registered in the same app.get()' });
}

app.get('/multiple-handlers', loggerMiddleware, finalHandler);

/* ------------------------------
   Utility: simple HTML escape for /greet
   ------------------------------ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ------------------------------
   Catch-all for unhandled GET routes (nice UX)
   ------------------------------ */
app.get('*', (req, res) => {
  res.status(404).type('html').send(`
    <h3>404 — Not Found</h3>
    <p>No GET route for <code>${escapeHtml(req.originalUrl)}</code>.</p>
    <p>Go back to <a href="/">home</a>.</p>
  `);
});

/* ------------------------------
   Start server
   ------------------------------ */
app.listen(PORT, () => {
  console.log(`Express GET playground listening on http://localhost:${PORT}/`);
});
