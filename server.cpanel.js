/**
 * cPanel / Phusion Passenger startup file for Namecheap shared hosting.
 * cPanel → Setup Node.js App → Application startup file: server.cpanel.js
 *
 * Do NOT use `next start` on shared hosting — Passenger requires this HTTP server pattern.
 * @see https://www.namecheap.com/support/knowledgebase/article.aspx/10686/29/
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "127.0.0.1";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (error) {
        console.error("Request handler error:", error);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).listen(port, hostname, () => {
      console.log(`Unique Sky Way ready on ${hostname}:${port} (${dev ? "dev" : "production"})`);
    });
  })
  .catch((error) => {
    console.error("Next.js prepare() failed:", error);
    process.exit(1);
  });
