import { createServer } from "node:http";
import app from "../api/serverless.mjs";

const server = createServer(app);

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Vercel function smoke server did not bind to a local port.");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`);
  if (!response.ok) throw new Error(`Vercel function smoke request failed with HTTP ${response.status}.`);
  console.log("Vercel function smoke test passed.");
} finally {
  await new Promise(resolve => server.close(resolve));
}
