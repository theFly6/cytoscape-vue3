import { formatNetLinkEdgeLabel, type NetworkProbeResult } from './networkProbe';

const cache = new Map<string, NetworkProbeResult>();

export function oHostCacheKey(sourceIp: string): string {
    return `o_host:${sourceIp}`;
}

/** 无向链路，source/target 顺序无关 */
export function netLinkCacheKey(source: string, target: string): string {
    const [a, b] = [source, target].sort();
    return `link:${a}-${b}`;
}

export function getNetworkProbeCache(key: string): NetworkProbeResult | undefined {
    return cache.get(key);
}

export function setNetworkProbeCache(key: string, data: NetworkProbeResult): void {
    cache.set(key, data);
}

export function hasNetworkProbeCache(key: string): boolean {
    return cache.has(key);
}

/** 从缓存生成 NET_LINK 边标签；无有效探测结果时返回 null */
export function getCachedNetLinkLabel(source: string, target: string): string | null {
    const cached = getNetworkProbeCache(netLinkCacheKey(source, target));
    if (!cached || cached.loading || cached.error) return null;
    if (!cached.latDataAB && !cached.latDataBA && !cached.bwDataAB && !cached.bwDataBA) {
        return null;
    }
    const label = formatNetLinkEdgeLabel(cached);
    return label === '已探测' ? null : label;
}

/** 子网拓扑加载后，为已有缓存的 NET_LINK 恢复边上文字 */
export function applyCachedNetLinkLabels<
    T extends { data?: { type?: string; source?: string; target?: string; label?: string } },
>(elements: T[]): T[] {
    return elements.map((el) => {
        if (el.data?.type !== 'NET_LINK' || !el.data.source || !el.data.target) {
            return el;
        }
        const label = getCachedNetLinkLabel(el.data.source, el.data.target);
        if (!label) return el;
        return { ...el, data: { ...el.data, label } };
    });
}
