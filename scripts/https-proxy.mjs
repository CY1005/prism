import { createServer } from "https";
import { readFileSync } from "fs";
import { request as httpRequest } from "http";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const options = {
  key: readFileSync(join(__dirname, "ssl/key.pem")),
  cert: readFileSync(join(__dirname, "ssl/cert.pem")),
};

const TARGET = "http://127.0.0.1:3000";

const server = createServer(options, (req, res) => {
  const proxyReq = httpRequest(
    `${TARGET}${req.url}`,
    {
      method: req.method,
      headers: {
        ...req.headers,
        "x-forwarded-proto": "https",
        "x-forwarded-for": req.socket.remoteAddress,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });

  req.pipe(proxyReq);
});

const PORT = 443;
server.listen(PORT, () => {
  console.log(`HTTPS proxy running on https://0.0.0.0:${PORT} -> ${TARGET}`);
});
