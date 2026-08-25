<?php
declare(strict_types=1);

final class PakistanLocationClient
{
    private string $baseUrl;

    public function __construct(string $baseUrl)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        if ($this->baseUrl === '') throw new InvalidArgumentException('A location API base URL is required.');
    }

    public function health(): array { return $this->request('/health'); }
    public function cities(string $search = ''): array { return $this->request('/api/v1/cities' . $this->query($search)); }
    public function city(string $cityCode): array { return $this->request('/api/v1/cities/' . rawurlencode($cityCode)); }
    public function areas(string $cityCode, string $search = ''): array { return $this->request('/api/v1/cities/' . rawurlencode($cityCode) . '/areas' . $this->query($search)); }
    public function blocks(string $areaCode, string $search = ''): array { return $this->request('/api/v1/areas/' . rawurlencode($areaCode) . '/blocks' . $this->query($search)); }
    public function hierarchy(string $cityCode): array { return $this->request('/api/v1/cities/' . rawurlencode($cityCode) . '/hierarchy'); }
    public function relationships(): array { return $this->request('/api/v1/relationships'); }

    private function query(string $search): string
    {
        return $search === '' ? '' : '?q=' . rawurlencode($search);
    }

    private function request(string $path): array
    {
        $url = $this->baseUrl . $path;
        if (function_exists('curl_init')) {
            $handle = curl_init($url);
            curl_setopt_array($handle, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
            $body = curl_exec($handle);
            if ($body === false) throw new RuntimeException('Location API request failed: ' . curl_error($handle));
            $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
            curl_close($handle);
        } else {
            $context = stream_context_create(['http' => ['ignore_errors' => true, 'timeout' => 15, 'header' => "Accept: application/json\r\n"]]);
            $body = @file_get_contents($url, false, $context);
            if ($body === false) throw new RuntimeException('Location API request failed.');
            $status = isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $match) ? (int) $match[1] : 200;
        }
        $decoded = json_decode((string) $body, true);
        if (!is_array($decoded)) throw new RuntimeException('Location API returned invalid JSON.');
        if ($status < 200 || $status >= 300) throw new RuntimeException((string) ($decoded['message'] ?? "Location API returned HTTP $status."));
        return $decoded;
    }
}
