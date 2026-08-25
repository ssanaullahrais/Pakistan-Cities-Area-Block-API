class PakistanLocationClient {
  constructor(baseUrl) {
    if (!baseUrl) throw new Error("A location API base URL is required.");
    this.baseUrl = String(baseUrl).replace(/\/$/, "");
  }

  async request(path) {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Location API returned HTTP ${response.status}.`);
    }
    return response.json();
  }

  getHealth() { return this.request("/health"); }
  getCities(search = "") { return this.request(`/api/v1/cities${search ? `?q=${encodeURIComponent(search)}` : ""}`); }
  getCity(cityCode) { return this.request(`/api/v1/cities/${encodeURIComponent(cityCode)}`); }
  getAreas(cityCode, search = "") { return this.request(`/api/v1/cities/${encodeURIComponent(cityCode)}/areas${search ? `?q=${encodeURIComponent(search)}` : ""}`); }
  getBlocks(areaCode, search = "") { return this.request(`/api/v1/areas/${encodeURIComponent(areaCode)}/blocks${search ? `?q=${encodeURIComponent(search)}` : ""}`); }
  getHierarchy(cityCode) { return this.request(`/api/v1/cities/${encodeURIComponent(cityCode)}/hierarchy`); }
  getRelationships() { return this.request("/api/v1/relationships"); }
}

module.exports = PakistanLocationClient;
module.exports.PakistanLocationClient = PakistanLocationClient;
module.exports.default = PakistanLocationClient;
