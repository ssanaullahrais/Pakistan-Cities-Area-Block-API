import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { PakistanLocationClient } from "../sdk/location-api-client.js";

const require = createRequire(import.meta.url);
const CommonJsClient = require("../sdk/location-api-client.cjs");
const root = fileURLToPath(new URL("../", import.meta.url));
const failures = [];
const checks = [];
const children = [];

const check = (condition, message) => {
  checks.push(message);
  if (!condition) failures.push(message);
};

const freePort = async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  server.close();
  await once(server, "close");
  return port;
};

const waitForHealth = async (baseUrl) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not become ready at ${baseUrl}.`);
};

const verifyApi = async (baseUrl, label) => {
  const esm = new PakistanLocationClient(baseUrl);
  const cjs = new CommonJsClient(baseUrl);
  const [health, cities, city, areas, blocks, hierarchy, relationships, cjsAreas] = await Promise.all([
    esm.getHealth(),
    esm.getCities("rawal"),
    esm.getCity("rwp"),
    esm.getAreas("rwp", "bahria"),
    esm.getBlocks("r80302494", "phase 8"),
    esm.getHierarchy("rwp"),
    esm.getRelationships(),
    cjs.getAreas("RWP"),
  ]);
  check(health.status === "ok", `${label}: health endpoint`);
  check(cities.data.some((item) => item.code === "RWP"), `${label}: city search`);
  check(city.data.some((item) => item.name === "RAWALPINDI"), `${label}: city lookup`);
  check(areas.data.some((item) => item.code === "R80302494"), `${label}: area lookup and search`);
  check(blocks.data.some((item) => item.code === "R80303617"), `${label}: block lookup and search`);
  check(hierarchy.data[0]?.areas?.length === 37, `${label}: hierarchy endpoint`);
  check(relationships.data.city_code_to_area_codes.RWP.includes("R80302494"), `${label}: relationships endpoint`);
  check(cjsAreas.count === 37, `${label}: CommonJS SDK`);
  const rootResponse = await fetch(`${baseUrl}/`);
  check((rootResponse.headers.get("content-type") || "").includes("text/html"), `${label}: interactive root page`);
  check((await rootResponse.text()).includes("Pakistan Location API Tester"), `${label}: interactive tester content`);
};

try {
  const rawCities = JSON.parse(await readFile(new URL("../data/cities.json", import.meta.url), "utf8"));
  const rawAreas = JSON.parse(await readFile(new URL("../data/areas.json", import.meta.url), "utf8"));
  const rawBlocks = JSON.parse(await readFile(new URL("../data/blocks.json", import.meta.url), "utf8"));
  check(rawCities.data.length === 570, "Direct JSON: city records");
  check(rawAreas.data.filter((item) => item.city_code === "RWP").length === 37, "Direct JSON: city-to-area relationship");
  check(rawBlocks.data.filter((item) => item.area_code === "R80302494").length === 45, "Direct JSON: area-to-block relationship");

  const nodePort = await freePort();
  const nodeProcess = spawn(process.execPath, [fileURLToPath(new URL("../server.mjs", import.meta.url)), "--host", "127.0.0.1", "--port", String(nodePort)], { cwd: root, stdio: "ignore" });
  children.push(nodeProcess);
  const nodeUrl = `http://127.0.0.1:${nodePort}`;
  await waitForHealth(nodeUrl);
  await verifyApi(nodeUrl, "Node API");

  if (spawnSync("php", ["--version"], { stdio: "ignore" }).status === 0) {
    const phpPort = await freePort();
    const phpProcess = spawn("php", ["-S", `127.0.0.1:${phpPort}`, "php-api/router.php"], { cwd: root, stdio: "ignore" });
    children.push(phpProcess);
    const phpUrl = `http://127.0.0.1:${phpPort}`;
    await waitForHealth(phpUrl);
    await verifyApi(phpUrl, "PHP API");
    const phpClient = spawnSync("php", ["examples/php/consume.php"], { cwd: root, env: { ...process.env, LOCATION_API_URL: phpUrl }, encoding: "utf8" });
    check(phpClient.status === 0, `PHP SDK: ${phpClient.stderr || "consumer example"}`);
    const phpResult = JSON.parse(phpClient.stdout || "{}");
    check(phpResult.areas === 37 && phpResult.blocks === 45, "PHP SDK: cascading lookup");
  } else {
    checks.push("PHP API and SDK skipped because PHP is not installed");
  }
} finally {
  for (const child of children) child.kill();
}

console.log(JSON.stringify({ status: failures.length ? "failed" : "passed", checks, failures }, null, 2));
if (failures.length) process.exitCode = 1;
