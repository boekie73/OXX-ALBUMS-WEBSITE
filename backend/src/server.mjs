import { createServer } from 'node:http';
import { createHandler } from './handler.mjs';

// Local, disabled demonstration only. No env flag can turn on receiving here.
const handler = createHandler({
  enabled: false,
  allowedOrigins: ['https://boekie73.github.io'],
  allowInsecureLoopback: true,
});
const server = createServer({ maxHeaderSize: 8192 }, handler);
server.requestTimeout = 10_000;
server.headersTimeout = 5000;
server.timeout = 10_000;
server.maxRequestsPerSocket = 20;
server.listen(8787, '127.0.0.1');
