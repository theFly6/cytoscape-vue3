/** 按节点 ip:port 缓存拓扑感知原始数据（会话内有效） */
const cache = new Map<string, unknown>();

export function perceptionCacheKey(ip: string, port: number | string = 22): string {
    return `${ip}:${port}`;
}

export function getPerceptionCache(ip: string, port: number | string = 22): unknown | undefined {
    return cache.get(perceptionCacheKey(ip, port));
}

export function setPerceptionCache(ip: string, port: number | string, data: unknown): void {
    cache.set(perceptionCacheKey(ip, port), data);
}

export function hasPerceptionCache(ip: string, port: number | string = 22): boolean {
    return cache.has(perceptionCacheKey(ip, port));
}
