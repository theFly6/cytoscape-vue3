import { ref } from 'vue';

/** 按节点 ip:port 缓存拓扑感知原始数据（会话内有效） */
const cache = new Map<string, unknown>();

/** 递增以触发 Vue 响应式更新（Map 本身不可追踪） */
export const perceptionCacheVersion = ref(0);

export function perceptionCacheKey(ip: string, port: number | string = 22): string {
    return `${ip}:${port}`;
}

export function getPerceptionCache(ip: string, port: number | string = 22): unknown | undefined {
    return cache.get(perceptionCacheKey(ip, port));
}

export function setPerceptionCache(ip: string, port: number | string, data: unknown): void {
    cache.set(perceptionCacheKey(ip, port), data);
    perceptionCacheVersion.value += 1;
}

export function hasPerceptionCache(ip: string, port: number | string = 22): boolean {
    return cache.has(perceptionCacheKey(ip, port));
}
