const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false, dir: process.cwd() });
const handle = app.getRequestHandler();

let server;

async function startServer() {
  if (!server) {
    await app.prepare();
    server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });
  }
  return server;
}

exports.handler = async (event, context) => {
  const server = await startServer();

  // Convert Lambda event to HTTP request format
  const { headers = {}, body, isBase64Encoded } = event;
  const path = event.rawPath || event.path || '/';
  const queryString = event.rawQueryString || '';

  return new Promise((resolve, reject) => {
    const req = {
      method: event.requestContext?.http?.method || event.httpMethod || 'GET',
      url: queryString ? `${path}?${queryString}` : path,
      headers: headers,
      body: isBase64Encoded ? Buffer.from(body, 'base64') : body,
    };

    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      writeHead(status, headers = {}) {
        this.statusCode = status;
        Object.entries(headers).forEach(([name, value]) => {
          this.setHeader(name, value);
        });
      },
      write(chunk) {
        chunks.push(Buffer.from(chunk));
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks).toString('utf8');

        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: body,
        });
      },
    };

    server.emit('request', req, res);
  });
};
