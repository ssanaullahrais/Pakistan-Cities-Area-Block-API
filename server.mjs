#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const PORT = Number(argument("--port") || process.env.PORT || 3100);
const HOST = argument("--host") || process.env.HOST || "127.0.0.1";
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
const DATA_DIRECTORY = new URL("./data/", import.meta.url);

const readData = async (filename) =>
  JSON.parse(await readFile(new URL(filename, DATA_DIRECTORY), "utf8"));

const [metadata, cityFile, areaFile, blockFile, hierarchyFile, relationshipFile] =
  await Promise.all([
    readData("metadata.json"),
    readData("cities.json"),
    readData("areas.json"),
    readData("blocks.json"),
    readData("hierarchy.json"),
    readData("relationships.json"),
  ]);
const [demoHtml, openApiJson] = await Promise.all([
  readFile(new URL("./public/index.html", import.meta.url), "utf8"),
  readFile(new URL("./openapi.json", import.meta.url), "utf8"),
]);

const normalizeCode = (value) => decodeURIComponent(value || "").trim().toUpperCase();
const normalizeQuery = (value) => String(value || "").trim().toLowerCase();

const sendJson = (response, status, payload) => {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    "content-length": Buffer.byteLength(body),
    "content-type": "application/json; charset=utf-8",
  });
  response.end(body);
};

const sendContent = (response, status, contentType, body) => {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=300",
    "content-length": Buffer.byteLength(body),
    "content-type": contentType,
  });
  response.end(body);
};

const notFound = (response) =>
  sendJson(response, 404, {
    error: "Not found",
    message: "The requested location record does not exist.",
  });

const filterByQuery = (records, query) => {
  const term = normalizeQuery(query);
  if (!term) return records;
  return records.filter(
    (record) =>
      record.name.toLowerCase().includes(term) ||
      record.code.toLowerCase().includes(term),
  );
};

createServer((request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-origin": "*",
    });
    return response.end();
  }

  if (request.method !== "GET") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/" || url.pathname === "/demo") {
    return sendContent(response, 200, "text/html; charset=utf-8", demoHtml);
  }

  if (url.pathname === "/openapi.json") {
    return sendContent(
      response,
      200,
      "application/json; charset=utf-8",
      openApiJson,
    );
  }

  if (url.pathname === "/health") {
    return sendJson(response, 200, {
      status: "ok",
      name: "Pakistan Cities, Areas and Blocks API",
      metadata,
      endpoints: [
        "/api/v1/cities",
        "/api/v1/cities/RWP",
        "/api/v1/cities/RWP/areas",
        "/api/v1/areas/R80302494/blocks",
        "/api/v1/cities/RWP/hierarchy",
        "/api/v1/relationships",
        "/openapi.json",
        "/demo",
      ],
    });
  }

  if (parts[0] !== "api" || parts[1] !== "v1") return notFound(response);

  if (parts.length === 3 && parts[2] === "cities") {
    const data = filterByQuery(cityFile.data, url.searchParams.get("q"));
    return sendJson(response, 200, { metadata, count: data.length, data });
  }

  if (parts[2] === "cities" && parts[3]) {
    const cityCode = normalizeCode(parts[3]);
    const cities = cityFile.data.filter((item) => item.code === cityCode);
    if (!cities.length) return notFound(response);

    if (parts.length === 4) {
      return sendJson(response, 200, {
        count: cities.length,
        data: cities,
      });
    }

    if (parts[4] === "areas") {
      const records = areaFile.data.filter((item) => item.city_code === cityCode);
      const data = filterByQuery(records, url.searchParams.get("q"));
      return sendJson(response, 200, { cities, count: data.length, data });
    }

    if (parts[4] === "hierarchy") {
      const data = hierarchyFile.data.filter((item) => item.code === cityCode);
      return data.length
        ? sendJson(response, 200, { count: data.length, data })
        : notFound(response);
    }
  }

  if (parts[2] === "areas" && parts[3] && parts[4] === "blocks") {
    const areaCode = normalizeCode(parts[3]);
    const area = areaFile.data.find((item) => item.code === areaCode);
    if (!area) return notFound(response);
    const records = blockFile.data.filter((item) => item.area_code === areaCode);
    const data = filterByQuery(records, url.searchParams.get("q"));
    return sendJson(response, 200, { area, count: data.length, data });
  }

  if (parts.length === 3 && parts[2] === "relationships") {
    return sendJson(response, 200, relationshipFile);
  }

  return notFound(response);
}).listen(PORT, HOST, () => {
  console.log(`Pakistan location API listening at http://${HOST}:${PORT}`);
});
