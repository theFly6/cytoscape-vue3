import { api } from '@/api/client';

export interface LatencyResult {
    target: string;
    latency_ms?: string;
    success: boolean;
    error?: string;
}

export interface LatencyResponse {
    success: boolean;
    source?: string;
    results?: LatencyResult[];
    error?: string;
}

export interface BandwidthResult {
    dest: string;
    bandwidth_mbps?: string;
    success: boolean;
    error?: string;
}

export interface BandwidthResponse {
    success: boolean;
    source?: string;
    results?: BandwidthResult[];
    error?: string;
}

export interface NetworkProbeResult {
    success: boolean;
    updateTime?: string;
    loading?: boolean | string;
    message?: string;
    error?: string;
    bandwidthLoading?: boolean;
    latData?: LatencyResponse;
    bwData?: BandwidthResponse;
    latDataAB?: LatencyResult;
    latDataBA?: LatencyResult;
    bwDataAB?: BandwidthResult;
    bwDataBA?: BandwidthResult;
    isBiDirectional?: boolean;
}

function firstLatencyResult(res: LatencyResponse | undefined, target: string): LatencyResult {
    const hit = res?.results?.find((r) => r.target === target);
    if (hit) return hit;
    return { target, success: false, error: res?.error ?? '无测量结果' };
}

function firstBandwidthResult(res: BandwidthResponse | undefined, dest: string): BandwidthResult {
    const hit = res?.results?.find((r) => r.dest === dest);
    if (hit) return hit;
    return { dest, success: false, error: res?.error ?? '无测量结果' };
}

export async function fetchNetworkLatency(source: string, targets: string): Promise<LatencyResponse> {
    const res = await api.get<LatencyResponse>('/network/latency', {
        params: { source, targets },
        timeout: 60_000,
    });
    return res.data;
}

export async function fetchNetworkBandwidth(source: string, dests: string): Promise<BandwidthResponse> {
    const res = await api.get<BandwidthResponse>('/network/bandwidth', {
        params: { source, dests },
        timeout: 180_000,
    });
    return res.data;
}

export type NetworkProbePhase = Partial<NetworkProbeResult>;

export async function probeNetLink(
    sourceA: string,
    sourceB: string,
    onPhase?: (phase: NetworkProbePhase) => void,
): Promise<NetworkProbeResult> {
    onPhase?.({ loading: true, message: '正在探测双向时延...' });

    const [latJsonAB, latJsonBA] = await Promise.all([
        fetchNetworkLatency(sourceA, sourceB),
        fetchNetworkLatency(sourceB, sourceA),
    ]);

    const latDataAB = firstLatencyResult(latJsonAB, sourceB);
    const latDataBA = firstLatencyResult(latJsonBA, sourceA);

    onPhase?.({
        latDataAB,
        latDataBA,
        bandwidthLoading: true,
        message: '正在探测双向带宽（iperf3，可能需 1–2 分钟）...',
    });

    const bwJsonAB = await fetchNetworkBandwidth(sourceA, sourceB);
    const bwJsonBA = await fetchNetworkBandwidth(sourceB, sourceA);

    return {
        success: true,
        updateTime: new Date().toLocaleString(),
        latDataAB,
        latDataBA,
        bwDataAB: firstBandwidthResult(bwJsonAB, sourceB),
        bwDataBA: firstBandwidthResult(bwJsonBA, sourceA),
        bandwidthLoading: false,
        isBiDirectional: true,
    };
}

export async function probeOHost(
    sourceIp: string,
    targetIps: string[],
    onPhase?: (phase: NetworkProbePhase) => void,
): Promise<NetworkProbeResult> {
    const targets = targetIps.join(',');
    onPhase?.({ loading: true, message: '正在探测到各节点的时延...' });

    const latJson = await fetchNetworkLatency(sourceIp, targets);
    onPhase?.({
        latData: latJson,
        bandwidthLoading: true,
        message: '正在探测到各节点的带宽（顺序执行，请耐心等待）...',
    });

    const bwJson = await fetchNetworkBandwidth(sourceIp, targets);

    return {
        success: true,
        updateTime: new Date().toLocaleString(),
        latData: latJson,
        bwData: bwJson,
        bandwidthLoading: false,
    };
}

/** 探测完成后用于 NET_LINK 边标签的简短摘要 */
export function formatNetLinkEdgeLabel(data: NetworkProbeResult): string {
    const lat =
        data.latDataAB?.success && data.latDataBA?.success
            ? `${data.latDataAB.latency_ms}↔${data.latDataBA.latency_ms}ms`
            : '';
    const bw =
        data.bwDataAB?.success || data.bwDataBA?.success
            ? [
                  data.bwDataAB?.success ? parseFloat(data.bwDataAB.bandwidth_mbps!).toFixed(0) : '?',
                  data.bwDataBA?.success ? parseFloat(data.bwDataBA.bandwidth_mbps!).toFixed(0) : '?',
              ].join('↔') + 'M'
            : '';
    if (lat && bw) return `${lat} · ${bw}`;
    if (lat) return lat;
    if (bw) return bw;
    return '已探测';
}
