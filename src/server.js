import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import chokidar from "chokidar";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const token = process.env.ROAM_API_TOKEN;
if (!token) throw new Error("ROAM_API_TOKEN not set");
const graph = process.env.ROAM_GRAPH;
if (!graph) throw new Error("ROAM_GRAPH not set");
const blocksPath = path.resolve("blocks");
const extToLang = {
  js: "javascript",
  py: "python",
};

async function push(uid, string) {
  const res = await fetch(`https://api.roamresearch.com/api/graph/${graph}/write`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "update-block",
      block: {
        uid,
        string,
      },
    }),
  });
  const { status, statusText } = res;
  if (status !== 200) {
    throw new Error(`Error: ${status} ${statusText}`);
  }
}

function codeToText(code, filename) {
  code = code.trim();
  const ext = filename.split(".").pop();
  const lang = extToLang[ext] || "";
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

function textToString(text) {
  return text;
}

async function main() {
  // Start a websocket server
  const server = new WebSocketServer({ port: 8080 });
  const openSockets = new Set();
  server.on("connection", (socket) => {
    console.log("A client has connected to the server!");
    openSockets.add(socket);

    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);
      socket.send(JSON.stringify({ message: `You sent: ${message}` }));
    });

    socket.on("close", () => {
      console.log("A client has disconnected from the server!");
      openSockets.delete(socket);
    });
  });

  // Watch for changes to blocks and push them to Roam
  console.log("Watching", blocksPath);
  chokidar.watch(blocksPath, { ignoreInitial: true, depth: 1 }).on("all", (event, filepath) => {
    console.log(event, filepath);
    const uid = filepath.replace(blocksPath, "").split("/")[1];
    const blockPath = path.join(blocksPath, uid);
    const files = fs
      .readdirSync(blockPath)
      .sort((a, b) => a[0] > b[0])
      .map((file) => {
        const filePath = path.join(blockPath, file);
        const content = fs.readFileSync(filePath, "utf8");
        let type = "text";
        const parts = file.split(".");
        if (parts[1] === "code") {
          type = "code";
        }
        return { path: filePath, content, type };
      });
    const string = files
      .map((file) => {
        if (file.type === "text") {
          return textToString(file.content);
        } else if (file.type === "code") {
          return codeToText(file.content, file.path);
        }
      })
      .join("");
    console.log(`Pushing new string to block ${uid}: ${string}`);
    push(uid, string);

    // Notify the client of changes
    openSockets.forEach((socket) => {
      socket.send(
        JSON.stringify({
          message: `Block ${uid} updated`,
          string,
          files,
        })
      );
    });
  });
}

main();
