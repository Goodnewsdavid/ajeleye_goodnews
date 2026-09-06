const fs = require("fs");
const path = require("path");
const https = require("https");

const html = fs.readFileSync(path.join(__dirname, "embed.html"), "utf8");
const dest = path.join(__dirname, "..", "assets", "photos");
fs.mkdirSync(dest, { recursive: true });

const urls = [...new Set(
  [...html.matchAll(/https:\/\/media-public\.canva\.com\/[^"\\]+/g)].map((m) =>
    m[0].replace(/\\u002F/g, "/").replace(/&amp;/g, "&")
  )
)];

console.log("public media", urls.length);
urls.forEach((u, i) => console.log(i, u));

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
        const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
        resolve({ file: path.basename(file), status: res.statusCode, type: res.headers["content-type"], size });
      });
    });
    req.on("error", (err) => resolve({ file, error: err.message }));
  });
}

(async () => {
  for (let i = 0; i < urls.length; i++) {
    const ext = urls[i].includes(".svg") ? "svg" : urls[i].includes(".png") ? "png" : "jpg";
    const file = path.join(dest, `canva-${String(i + 1).padStart(2, "0")}.${ext}`);
    console.log(await download(urls[i], file));
  }
})();
