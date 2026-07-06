import { api } from '@/api/client';

export function extractGpuToGpu(gpuToGpu: any, gpuIndex: number) {
    const result: any = {};
    if (!gpuToGpu) return result;

    for (const metric in gpuToGpu) {
        result[metric] = {};
        for (const p2pMode in gpuToGpu[metric]) {
            result[metric][p2pMode] = {};
            const modeObj = gpuToGpu[metric][p2pMode];

            for (const direction in modeObj) {
                const matrix: any[][] = modeObj[direction];
                result[metric][p2pMode][direction] = [matrix[gpuIndex]];
            }
        }
    }
    return result;
}

export function extractGpuToHost(gpuToHost: any, gpuIndex: number) {
    if (!gpuToHost) return {};
    const result: any = {};

    for (const metric in gpuToHost) {
        result[metric] = {};
        for (const mode in gpuToHost[metric]) {
            result[metric][mode] = {};
            for (const dir in gpuToHost[metric][mode]) {
                const arr = gpuToHost[metric][mode][dir];
                result[metric][mode][dir] = Array.isArray(arr)
                    ? arr.length > gpuIndex
                        ? arr[gpuIndex]
                        : null
                    : 'N/A';
            }
        }
    }
    return result;
}

export function extractCpuRelatedGpu(gpuToHost: any, cpuIndex: number, gpuNum: number, cpuNum: number) {
    if (!gpuToHost || cpuNum <= 0) return {};
    const result: any = {};
    const x = Math.floor(gpuNum / cpuNum);
    const start = cpuIndex * x;
    const end = (cpuIndex + 1) * x;

    for (const metric in gpuToHost) {
        result[metric] = {};
        for (const mode in gpuToHost[metric]) {
            result[metric][mode] = {};
            for (const dir in gpuToHost[metric][mode]) {
                const arr = gpuToHost[metric][mode][dir];
                result[metric][mode][dir] = Array.isArray(arr)
                    ? arr.slice(start, end).length > 0
                        ? arr.slice(start, end)
                        : ['N/A']
                    : ['N/A'];
            }
        }
    }
    return result;
}

export function buildGpuDetail(label: string, originalData: any) {
    if (!originalData?.gpu_metadata) {
        return { error: '硬件元数据缺失' };
    }
    const match = label.match(/gpu(\d+)/i);
    if (!match) return { error: `无法识别的 GPU 标识: ${label}` };

    const index = parseInt(match[1], 10);
    const metadataArray = originalData.gpu_metadata;
    if (!Array.isArray(metadataArray) || index >= metadataArray.length) {
        return { error: `节点 ${label} 超出硬件检测范围` };
    }

    const targetGpu = metadataArray[index];
    return {
        index: targetGpu.index,
        name: targetGpu.name,
        pci_domain: targetGpu.pci_domain,
        pci_bus: targetGpu.pci_bus,
        total_memory_gb: targetGpu.total_memory_gb,
        source: targetGpu.source,
        _type: 'GPU_DETAIL',
    };
}

export function buildLinkPerception(
    info: { source: string; target: string },
    originalData: any,
    gpuNum: number,
    cpuNum: number,
) {
    const source = info.source.toLowerCase();
    const target = info.target.toLowerCase();
    let filtered: Record<string, unknown> = {};

    if (source.includes('gpu')) {
        const gpuIndex = parseInt(source.match(/gpu(\d+)/)![1], 10);
        if (target.includes('marslink')) {
            filtered = { gpu_to_gpu: extractGpuToGpu(originalData.gpu_to_gpu, gpuIndex) };
        } else if (target.includes('pci')) {
            filtered = { gpu_to_host: extractGpuToHost(originalData.gpu_to_host, gpuIndex) };
        }
    } else if (source.includes('cpu')) {
        const cpuIndex = parseInt(source.match(/cpu(\d+)/)![1], 10);
        filtered = {
            cpu_info: originalData.cpu_info,
            related_gpu_to_host: extractCpuRelatedGpu(originalData.gpu_to_host, cpuIndex, gpuNum, cpuNum),
        };
    } else {
        filtered = { ...originalData };
    }

    return { measurement_info: originalData.measurement_info, ...filtered };
}

/** 解析 Marslink GPU 下拉选项对应的目标 GPU 索引 */
export function resolveGpuTargetFilter(selected: string): { isAll: boolean; targetIdx: number | null } {
    if (!selected || selected.includes('gpu*')) {
        return { isAll: true, targetIdx: null };
    }
    const arrowMatch = selected.match(/->\s*gpu(\d+)/i);
    if (arrowMatch) {
        return { isAll: false, targetIdx: parseInt(arrowMatch[1], 10) };
    }
    const matches = [...selected.matchAll(/gpu(\d+)/gi)];
    if (matches.length > 0) {
        return { isAll: false, targetIdx: parseInt(matches[matches.length - 1][1], 10) };
    }
    return { isAll: true, targetIdx: null };
}

export function formatLinkGpuOption(baseLabel: string, item: string, source?: string): string {
    const template = baseLabel.includes('*') ? baseLabel : `${source ?? 'gpu'} -> gpu*`;
    return template.replace('*', item);
}

export function initialLinkGpuSelection(info: { label?: string; source?: string; labels?: string[] }): string {
    if (!info.labels?.length) return '';
    const base = info.label?.includes('*') ? info.label : `${info.source} -> gpu*`;
    return base.replace('*', 'gpu*');
}

export async function fetchNodeDetail(ip: string, port: number | string) {
    const res = await api.get('/topology/info/node/detail', {
        params: { ip, port },
        timeout: 120000,
    });
    return res.data;
}

export function resolveNodeEndpoint(info: {
    ip?: string;
    port?: number | string;
    properties?: { ip?: string; port?: number | string };
}) {
    const ip = info.ip || info.properties?.ip;
    const port = info.port ?? info.properties?.port ?? 22;
    return { ip, port };
}
