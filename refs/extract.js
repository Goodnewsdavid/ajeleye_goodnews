const fs = require("fs");
const path = require("path");
const https = require("https");

const html = fs.readFileSync(path.join(__dirname, "embed.html"), "utf8");

const rawLines = [...html.matchAll(/\["((?:\\.|[^"\\])*)\\n"/g)].map((m) => {
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return m[1].replace(/\\n/g, "").replace(/\\"/g, '"');
  }
});

console.log("=== RAW LINES ===");
rawLines.forEach((line, i) => console.log(`${String(i).padStart(3, "0")}: ${line}`));

console.log("\n=== LONGER TEXT BLOBS ===");
const blobs = [...html.matchAll(/"((?:\\.|[^"\\]){8,240})"/g)].map((m) => {
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return m[1];
  }
});

const skip = /http|canva|function|thumbnail|document|AAAA|H4sI|font|rgba|width|height|nonce|integrity|sha512|application|javascript|stylesheet|sentry|cloudflare|amazonaws|media-public|video-public|brand=|csig=/i;
const seen = new Set();
for (const b of blobs) {
  if (skip.test(b)) continue;
  if (b.startsWith("{") || b.startsWith("[") || /^[A-Za-z0-9+/=_-]{40,}$/.test(b)) continue;
  if (seen.has(b)) continue;
  seen.add(b);
  console.log(b);
}

const urls = [...html.matchAll(/https:\/\/media\.canva\.com\/v2\/document-image[^"\\]+/g)].map((m) =>
  m[0].replace(/&amp;/g, "&")
);
console.log(`\n=== DOCUMENT IMAGES (${urls.length}) ===`);
urls.forEach((u, i) => console.log(i, u.slice(0, 160)));

const dest = path.join(__dirname, "slides");
fs.mkdirSync(dest, { recursive: true });

function download(url, file) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, file).then(resolve);
      }
      const out = fs.createWriteStream(file);
      res.pipe(out);
      out.on("finish", () => {
        out.close();
        resolve({ file, status: res.statusCode, type: res.headers["content-type"], size: fs.statSync(file).size });
      });
    });
    req.on("error", (err) => resolve({ file, error: err.message }));
  });
}

(async () => {
  const unique = [...new Set(urls)];
  for (let i = 0; i < unique.length; i++) {
    const file = path.join(dest, `slide-${String(i + 1).padStart(2, "0")}.png`);
    const result = await download(unique[i], file);
    console.log("DL", result);
  }
})();
