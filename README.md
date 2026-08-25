# Pakistan Cities, Areas and Blocks API

A portable, read-only location dataset and API for checkout pages, address
validation, delivery forms and logistics integrations.

## Fastest start

```bash
git clone https://github.com/ssanaullahrais/Pakistan-Cities-Area-Block-API.git
cd Pakistan-Cities-Area-Block-API
npm start
```

Open `http://127.0.0.1:3100`. The ready-made tester loads the complete
City → Area → Block selector. There are no Node package dependencies and no
database or configuration step.

## Included data

| Dataset | Records |
| --- | ---: |
| Selectable cities | 570 |
| Unique routing city codes | 549 |
| Areas | 1,093 |
| Blocks | 12,638 |

Every area contains a `city_code`. Every block contains an `area_code` and
`city_code`, allowing applications to join records without matching names.

## Choose an integration method

### Direct JSON — any framework

Copy `data/` into PHP, Laravel, Node.js, Next.js, Python, Java, .NET, React or
another project. No server package or database is required.

- `cities.json`
- `areas.json`
- `blocks.json`
- `relationships.json`
- `hierarchy.json`
- `metadata.json`

Use the three flat files for dependent selectors. Use `hierarchy.json` when one
large nested file is more convenient.

### Ready Node.js API

Copy `data/`, `public/`, `openapi.json`, `package.json` and `server.mjs`, then:

```bash
npm start
```

No `npm install` is required. The backend uses only Node.js built-ins. Node.js
20 or newer is recommended. The default URL is `http://127.0.0.1:3100`.

Choose another host or port when needed:

```bash
node server.mjs --host 0.0.0.0 --port 8080
```

Install directly into an existing Node project and launch the included API:

```bash
npm install github:ssanaullahrais/Pakistan-Cities-Area-Block-API
npx pakistan-location-api --port 3100
```

### Ready PHP API

Copy `data/`, `openapi.json` and `php-api/`, then run with PHP 8:

```bash
php -S 127.0.0.1:3100 php-api/router.php
```

For Apache or Nginx, route requests to `php-api/index.php`. By default, `data/`
must sit beside `php-api/`. Set `LOCATION_DATA_DIR` to an absolute path if the
dataset is stored elsewhere.

Opening the PHP server root displays the same interactive tester as Node.

To call a hosted instance from Laravel, Symfony or plain PHP, copy
`sdk/PakistanLocationClient.php` and require it:

```php
require __DIR__ . '/sdk/PakistanLocationClient.php';

$api = new PakistanLocationClient('https://locations.example.com');
$cities = $api->cities('rawal');
$areas = $api->areas('RWP');
$blocks = $api->blocks('R80302494');
```

Composer projects can install from GitHub without Packagist:

```bash
composer config repositories.pakistan-locations vcs https://github.com/ssanaullahrais/Pakistan-Cities-Area-Block-API
composer require ssanaullahrais/pakistan-cities-area-block-api:dev-main
```

Then `require vendor/autoload.php`; the same `PakistanLocationClient` class is
available automatically.

### JavaScript SDK — React, Vue, Next.js, Node.js or HTML

Install from GitHub or copy `sdk/location-api-client.js`. It uses standard
`fetch` and has no runtime dependencies. TypeScript declarations are included.

```bash
npm install github:ssanaullahrais/Pakistan-Cities-Area-Block-API
```

ES modules, including React, Vue, Vite and modern Node.js:

```js
import { PakistanLocationClient } from "pakistan-cities-area-block-api"

const locations = new PakistanLocationClient("http://127.0.0.1:3100")
const cities = await locations.getCities()
const areas = await locations.getAreas("RWP")
const blocks = await locations.getBlocks("R80302494")
```

CommonJS projects:

```js
const { PakistanLocationClient } = require("pakistan-cities-area-block-api")

const locations = new PakistanLocationClient("http://127.0.0.1:3100")
const areas = await locations.getAreas("RWP")
```

React example:

```jsx
import { useEffect, useState } from "react"
import { PakistanLocationClient } from "pakistan-cities-area-block-api"

const api = new PakistanLocationClient("https://locations.example.com")

export function CitySelect() {
  const [cities, setCities] = useState([])

  useEffect(() => {
    api.getCities().then((response) => setCities(response.data))
  }, [])

  return (
    <select>
      {cities.map((city) => (
        <option key={`${city.code}-${city.name}`} value={city.code}>
          {city.name}
        </option>
      ))}
    </select>
  )
}
```

React is a frontend library, so it calls either the Node/PHP adapter or hosted
JSON files. It does not create backend routes by itself.

### Plain HTML or WordPress

Copy `sdk/location-api-client.js` into the site and load it as a module. The API
can be hosted by either included backend:

```html
<select id="city"></select>

<script type="module">
  import { PakistanLocationClient } from "/assets/location-api-client.js"

  const api = new PakistanLocationClient("https://locations.example.com")
  const response = await api.getCities()
  const city = document.querySelector("#city")

  city.innerHTML = response.data
    .map(({ code, name }) => `<option value="${code}">${name}</option>`)
    .join("")
</script>
```

For a ready-made three-field implementation, copy `public/index.html`. It
automatically uses the domain and port from which it is served; no URL edit is
required.

A complete cascading React project is included in `examples/react`:

```bash
cd examples/react
npm install
npm run dev
```

It defaults to `http://127.0.0.1:3100`. Set `VITE_LOCATION_API_URL` when the API
uses another address.

## SDK method map

| Operation | JavaScript | PHP |
| --- | --- | --- |
| Health | `getHealth()` | `health()` |
| List/search cities | `getCities(search)` | `cities($search)` |
| Get city code | `getCity(code)` | `city($code)` |
| Areas for city | `getAreas(code, search)` | `areas($code, $search)` |
| Blocks for area | `getBlocks(code, search)` | `blocks($code, $search)` |
| Nested hierarchy | `getHierarchy(code)` | `hierarchy($code)` |
| Relationship maps | `getRelationships()` | `relationships()` |

## Endpoints and example responses

All endpoints are read-only, return JSON and support cross-origin requests.

### Health

```http
GET /health
```

```json
{
  "status": "ok",
  "metadata": {
    "country_code": "PK",
    "counts": { "city_records": 570, "city_codes": 549, "areas": 1093, "blocks": 12638 }
  }
}
```

### Cities

```http
GET /api/v1/cities
GET /api/v1/cities?q=rawal
GET /api/v1/cities/RWP
```

```json
{
  "count": 1,
  "data": [{ "id": null, "code": "RWP", "name": "RAWALPINDI" }]
}
```

City-by-code returns an array because some routing codes belong to multiple
selectable city names.

### Areas for a city

```http
GET /api/v1/cities/RWP/areas
GET /api/v1/cities/RWP/areas?q=bahria
```

```json
{
  "count": 37,
  "data": [
    {
      "id": 885,
      "code": "R80302494",
      "name": "Rawalpindi - Bahria Town",
      "city_code": "RWP"
    }
  ]
}
```

### Blocks for an area

```http
GET /api/v1/areas/R80302494/blocks
GET /api/v1/areas/R80302494/blocks?q=phase%208
```

```json
{
  "count": 45,
  "data": [
    {
      "id": 22761,
      "code": "R80303617",
      "name": "Phase 8",
      "city_code": "RWP",
      "area_id": 885,
      "area_code": "R80302494"
    }
  ]
}
```

### Nested hierarchy

```http
GET /api/v1/cities/RWP/hierarchy
```

```json
{
  "count": 1,
  "data": [
    {
      "code": "RWP",
      "name": "RAWALPINDI",
      "areas": [
        {
          "code": "R80302494",
          "name": "Rawalpindi - Bahria Town",
          "blocks": [{ "code": "R80303617", "name": "Phase 8" }]
        }
      ]
    }
  ]
}
```

### Relationship maps

```http
GET /api/v1/relationships
```

```json
{
  "data": {
    "city_code_to_area_codes": { "RWP": ["R80302393", "R80302494"] },
    "area_code_to_block_codes": { "R80302494": ["RPK4944", "R80303617"] }
  }
}
```

## Relationship flow

```text
City code ──GET /cities/{cityCode}/areas──▶ Area code
Area code ──GET /areas/{areaCode}/blocks──▶ Block code
```

```text
RAWALPINDI (RWP)
└── Rawalpindi - Bahria Town (R80302494)
    └── Phase 8 (R80303617)
```

Store codes with display names. Codes are intended for delivery integrations;
names are intended for user interfaces.

## Test locally

Start either backend and open `http://127.0.0.1:3100`. The interactive page
tests the complete City → Area → Block flow. Its API base URL can be changed for
local, staging or production use.

The OpenAPI 3.1 specification is served at `GET /openapi.json` and can be
imported into Postman, Insomnia, Swagger UI or an API gateway.

```bash
npm test
```

The test suite validates counts, duplicate identifiers and every parent-child
link. It then starts fresh Node and PHP servers and calls every SDK method
against both adapters. PHP checks are skipped only when PHP is not installed.

Run the standalone consumer examples while either API adapter is active:

```bash
node examples/node/consume.mjs
node examples/node/consume.cjs
php examples/php/consume.php
```

## Docker

```bash
docker build -t pakistan-location-api .
docker run --rm -p 3100:3100 pakistan-location-api
```

## Project structure

```text
data/                       Portable JSON dataset
php-api/                    PHP 8 HTTP adapter
public/index.html           Interactive browser tester
sdk/location-api-client.js  Framework-neutral JavaScript SDK
sdk/location-api-client.cjs CommonJS JavaScript SDK
sdk/location-api-client.d.ts TypeScript declarations
sdk/PakistanLocationClient.php PHP SDK
examples/                    Ready Node, PHP and React consumers
scripts/validate-data.mjs   Dataset validation
scripts/test-integrations.mjs Cross-adapter integration tests
openapi.json                OpenAPI 3.1 specification
server.mjs                  Node.js HTTP adapter
Dockerfile                  Container deployment
```
