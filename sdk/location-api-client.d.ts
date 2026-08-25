export interface City { id: number | null; code: string; name: string }
export interface Area { id: number; code: string; name: string; city_code: string }
export interface Block { id: number; code: string; name: string; city_code: string; area_id: number; area_code: string }
export interface ListResponse<T> { count: number; data: T[]; [key: string]: unknown }
export interface HealthResponse { status: "ok"; name: string; metadata: { country_code: string; counts: { city_records: number; city_codes: number; areas: number; blocks: number } }; endpoints: string[] }

export class PakistanLocationClient {
  constructor(baseUrl: string);
  readonly baseUrl: string;
  request<T = unknown>(path: string): Promise<T>;
  getHealth(): Promise<HealthResponse>;
  getCities(search?: string): Promise<ListResponse<City>>;
  getCity(cityCode: string): Promise<ListResponse<City>>;
  getAreas(cityCode: string, search?: string): Promise<ListResponse<Area>>;
  getBlocks(areaCode: string, search?: string): Promise<ListResponse<Block>>;
  getHierarchy(cityCode: string): Promise<ListResponse<unknown>>;
  getRelationships(): Promise<{ data: { city_code_to_area_codes: Record<string, string[]>; area_code_to_block_codes: Record<string, string[]> } }>;
}

export default PakistanLocationClient;
