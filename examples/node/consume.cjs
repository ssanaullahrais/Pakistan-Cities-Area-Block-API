const { PakistanLocationClient } = require("../../sdk/location-api-client.cjs");

const api = new PakistanLocationClient(process.env.LOCATION_API_URL || "http://127.0.0.1:3100");
Promise.all([api.getCities("rawal"), api.getAreas("RWP"), api.getBlocks("R80302494")])
  .then(([cities, areas, blocks]) => console.log({ matchingCities: cities.count, areas: areas.count, blocks: blocks.count }))
  .catch((error) => { console.error(error); process.exitCode = 1; });
