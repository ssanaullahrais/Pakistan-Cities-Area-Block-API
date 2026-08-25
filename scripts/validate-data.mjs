import { readFile } from "node:fs/promises";

const load = async (filename) =>
  JSON.parse(
    await readFile(new URL(`../data/${filename}`, import.meta.url), "utf8"),
  );

const [metadata, citiesFile, areasFile, blocksFile, hierarchyFile, relationshipsFile] =
  await Promise.all([
    load("metadata.json"),
    load("cities.json"),
    load("areas.json"),
    load("blocks.json"),
    load("hierarchy.json"),
    load("relationships.json"),
  ]);

const cities = citiesFile.data;
const areas = areasFile.data;
const blocks = blocksFile.data;
const hierarchy = hierarchyFile.data;

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const duplicateCount = (records, key) =>
  records.length - new Set(records.map((record) => record[key])).size;

const cityCodes = new Set(cities.map((city) => city.code));
const areaCodes = new Set(areas.map((area) => area.code));
const blockIds = new Set(blocks.map((block) => block.id));

check(cities.length === metadata.counts.city_records, "City count differs from metadata.");
check(cityCodes.size === metadata.counts.city_codes, "City-code count differs from metadata.");
check(areas.length === metadata.counts.areas, "Area count differs from metadata.");
check(blocks.length === metadata.counts.blocks, "Block count differs from metadata.");
check(hierarchy.length === cities.length, "Hierarchy city count is incomplete.");
check(
  new Set(cities.map((city) => `${city.code}:${city.name}`)).size === cities.length,
  "Duplicate city code/name pairs found.",
);
check(duplicateCount(areas, "code") === 0, "Duplicate area codes found.");
check(blockIds.size === blocks.length, "Duplicate block IDs found.");
check(
  areas.every((area) => cityCodes.has(area.city_code)),
  "One or more areas reference a missing city.",
);
check(
  blocks.every((block) => areaCodes.has(block.area_code)),
  "One or more blocks reference a missing area.",
);
check(
  [...cities, ...areas, ...blocks].every(
    (record) => record.code && record.name && record.name.trim() === record.name,
  ),
  "Blank or untrimmed names/codes found.",
);

const rawalpindiAreas = areas.filter((area) => area.city_code === "RWP");
const bahriaBlocks = blocks.filter(
  (block) => block.area_code === "R80302494",
);
check(rawalpindiAreas.length === 37, "Rawalpindi should contain 37 areas.");
check(
  bahriaBlocks.length === 45,
  "Rawalpindi Bahria Town should contain 45 blocks.",
);
check(
  bahriaBlocks.some(
    (block) => block.name === "Phase 8" && block.code === "R80303617",
  ),
  "Expected Bahria Town Phase 8 block mapping is missing.",
);
check(
  Object.keys(relationshipsFile.data.city_code_to_area_codes).length ===
    cityCodes.size,
  "City-to-area relationship coverage is incomplete.",
);
check(
  Object.keys(relationshipsFile.data.area_code_to_block_codes).length ===
    areaCodes.size,
  "Area-to-block relationship coverage is incomplete.",
);

const report = {
  status: failures.length ? "failed" : "passed",
  counts: metadata.counts,
  checks: {
    shared_city_code_rows: duplicateCount(cities, "code"),
    duplicate_area_codes: duplicateCount(areas, "code"),
    duplicate_block_ids: blocks.length - blockIds.size,
    orphan_areas: areas.filter((area) => !cityCodes.has(area.city_code)).length,
    orphan_blocks: blocks.filter((block) => !areaCodes.has(block.area_code)).length,
    rawalpindi_areas: rawalpindiAreas.length,
    bahria_town_blocks: bahriaBlocks.length,
  },
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
