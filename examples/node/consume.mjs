import { PakistanLocationClient } from "../../sdk/location-api-client.js";

const api = new PakistanLocationClient(process.env.LOCATION_API_URL || "http://127.0.0.1:3100");
const cities = await api.getCities("rawal");
const areas = await api.getAreas("RWP");
const blocks = await api.getBlocks("R80302494");

console.log({ matchingCities: cities.count, areas: areas.count, blocks: blocks.count });
