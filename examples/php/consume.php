<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/sdk/PakistanLocationClient.php';

$api = new PakistanLocationClient(getenv('LOCATION_API_URL') ?: 'http://127.0.0.1:3100');
$cities = $api->cities('rawal');
$areas = $api->areas('RWP');
$blocks = $api->blocks('R80302494');

echo json_encode(['matching_cities' => $cities['count'], 'areas' => $areas['count'], 'blocks' => $blocks['count']], JSON_THROW_ON_ERROR);
