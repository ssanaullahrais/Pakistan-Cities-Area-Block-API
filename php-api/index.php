<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=3600, stale-while-revalidate=86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(405, ['error' => 'Method not allowed']);

$configured = getenv('LOCATION_DATA_DIR');
$dataDirectory = $configured !== false && $configured !== ''
    ? rtrim($configured, DIRECTORY_SEPARATOR)
    : dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';

$metadata = loadJson($dataDirectory . DIRECTORY_SEPARATOR . 'metadata.json');
$cities = loadJson($dataDirectory . DIRECTORY_SEPARATOR . 'cities.json')['data'];
$areas = loadJson($dataDirectory . DIRECTORY_SEPARATOR . 'areas.json')['data'];
$blocks = loadJson($dataDirectory . DIRECTORY_SEPARATOR . 'blocks.json')['data'];
$hierarchy = loadJson($dataDirectory . DIRECTORY_SEPARATOR . 'hierarchy.json')['data'];
$relationships = loadJson($dataDirectory . DIRECTORY_SEPARATOR . 'relationships.json');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$parts = array_values(array_filter(explode('/', trim($path, '/')), 'strlen'));
$search = strtolower(trim((string) ($_GET['q'] ?? '')));

if ($path === '/' || $path === '/health') respond(200, ['status' => 'ok', 'name' => 'Pakistan Cities, Areas and Blocks API', 'metadata' => $metadata]);
if ($path === '/openapi.json') {
    $spec = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'openapi.json';
    if (!is_file($spec)) notFound();
    header('Content-Type: application/json; charset=utf-8'); readfile($spec); exit;
}
if (($parts[0] ?? null) !== 'api' || ($parts[1] ?? null) !== 'v1') notFound();

if (count($parts) === 3 && ($parts[2] ?? null) === 'cities') {
    $data = filterSearch($cities, $search);
    respond(200, ['metadata' => $metadata, 'count' => count($data), 'data' => $data]);
}
if (($parts[2] ?? null) === 'cities' && isset($parts[3])) {
    $cityCode = strtoupper(rawurldecode($parts[3]));
    $matchingCities = array_values(array_filter($cities, fn(array $city): bool => $city['code'] === $cityCode));
    if ($matchingCities === []) notFound();
    if (count($parts) === 4) respond(200, ['count' => count($matchingCities), 'data' => $matchingCities]);
    if (($parts[4] ?? null) === 'areas') {
        $records = array_values(array_filter($areas, fn(array $area): bool => $area['city_code'] === $cityCode));
        $data = filterSearch($records, $search);
        respond(200, ['cities' => $matchingCities, 'count' => count($data), 'data' => $data]);
    }
    if (($parts[4] ?? null) === 'hierarchy') {
        $data = array_values(array_filter($hierarchy, fn(array $city): bool => $city['code'] === $cityCode));
        respond(200, ['count' => count($data), 'data' => $data]);
    }
}
if (($parts[2] ?? null) === 'areas' && isset($parts[3]) && ($parts[4] ?? null) === 'blocks') {
    $areaCode = strtoupper(rawurldecode($parts[3]));
    $matchingArea = null;
    foreach ($areas as $area) if ($area['code'] === $areaCode) { $matchingArea = $area; break; }
    if ($matchingArea === null) notFound();
    $records = array_values(array_filter($blocks, fn(array $block): bool => $block['area_code'] === $areaCode));
    $data = filterSearch($records, $search);
    respond(200, ['area' => $matchingArea, 'count' => count($data), 'data' => $data]);
}
if (count($parts) === 3 && ($parts[2] ?? null) === 'relationships') respond(200, $relationships);
notFound();

function loadJson(string $path): array {
    if (!is_file($path)) respond(500, ['error' => 'Dataset file not found', 'path' => basename($path)]);
    $decoded = json_decode((string) file_get_contents($path), true);
    if (!is_array($decoded)) respond(500, ['error' => 'Dataset file is invalid', 'path' => basename($path)]);
    return $decoded;
}
function filterSearch(array $records, string $search): array {
    if ($search === '') return array_values($records);
    return array_values(array_filter($records, static fn(array $record): bool =>
        str_contains(strtolower((string) $record['name']), $search) || str_contains(strtolower((string) $record['code']), $search)
    ));
}
function respond(int $status, array $payload): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit;
}
function notFound(): never { respond(404, ['error' => 'Not found', 'message' => 'The requested location record does not exist.']); }
