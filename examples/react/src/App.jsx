import { useEffect, useMemo, useState } from "react";
import { PakistanLocationClient } from "../../../sdk/location-api-client.js";

const baseUrl = import.meta.env.VITE_LOCATION_API_URL || "http://127.0.0.1:3100";

export default function App() {
  const api = useMemo(() => new PakistanLocationClient(baseUrl), []);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [block, setBlock] = useState("");
  const [status, setStatus] = useState("Connecting…");

  useEffect(() => {
    api.getCities().then(({ data }) => { setCities(data); setStatus("Connected"); }).catch((error) => setStatus(error.message));
  }, [api]);

  async function changeCity(event) {
    const code = event.target.value;
    setCity(code); setArea(""); setBlock(""); setBlocks([]);
    setAreas(code ? (await api.getAreas(code)).data : []);
  }

  async function changeArea(event) {
    const code = event.target.value;
    setArea(code); setBlock("");
    setBlocks(code ? (await api.getBlocks(code)).data : []);
  }

  return <main>
    <span className="status">{status}</span>
    <h1>Pakistan location selector</h1>
    <p>React consuming the framework-neutral SDK.</p>
    <section>
      <label>City<select aria-label="City" value={city} onChange={changeCity}><option value="">Select a city</option>{cities.map((item) => <option key={`${item.code}-${item.name}`} value={item.code}>{item.name}</option>)}</select></label>
      <label>Area<select aria-label="Area" value={area} onChange={changeArea} disabled={!city}><option value="">Select an area</option>{areas.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
      <label>Block<select aria-label="Block" value={block} onChange={(event) => setBlock(event.target.value)} disabled={!area}><option value="">Select a block</option>{blocks.map((item) => <option key={item.id} value={item.code}>{item.name}</option>)}</select></label>
    </section>
    <pre>{JSON.stringify({ city_code: city || null, area_code: area || null, block_code: block || null }, null, 2)}</pre>
  </main>;
}
