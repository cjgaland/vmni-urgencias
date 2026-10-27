// Servidor estático mínimo sin dependencias — solo para desarrollo local.
const http = require("http");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const PUERTO = process.env.PORT || 8123;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta === "/") ruta = "/index.html";
  const fichero = path.normalize(path.join(RAIZ, ruta));
  if (!fichero.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.readFile(fichero, (err, datos) => {
    if (err) { res.writeHead(404); return res.end("No encontrado"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fichero)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(datos);
  });
}).listen(PUERTO, "127.0.0.1", () => console.log(`VMNI en http://localhost:${PUERTO}`));
