import { api } from '@/api/client';

export interface RealNodeContext {
    ip: string;
    hostname: string;
    port: number | string;
}

export type CytoscapeElement = {
    group: 'nodes' | 'edges';
    data: Record<string, unknown>;
    style?: Record<string, unknown>;
};

function inferAcceleratorType(hostname: string, label: string): string {
    const text = `${hostname} ${label}`.toLowerCase();
    if (text.includes('mccx')) return '摩尔线程';
    if (text.includes('mx')) return 'MetaX';
    if (text.includes('node')) return 'NVIDIA';
    return 'Unknown';
}

function inferNodeTypeFromId(id: string, fallback = 'DEFAULT'): string {
    const lower = id.toLowerCase();
    if (lower.includes('numa')) return 'NUMA';
    if (lower.includes('gpu')) return 'GPU';
    if (lower.includes('cpu')) return 'CPU';
    if (lower.includes('pci')) return 'PCIe';
    if (lower.includes('nic')) return 'NIC';
    return fallback;
}

function buildRealHostFullLabel(ctx: RealNodeContext, label: string, accelerator: string): string {
    let card = `${label || ctx.hostname}\n`;
    card += `--------------------------\n`;
    card += `📍 IP: ${ctx.ip}:${ctx.port}\n`;
    card += `🚀 加速卡: ${accelerator}\n`;
    card += `状态: 🟢 已连接`;
    return card;
}

export function normalizeCytoscapeElements(
    rawElements: CytoscapeElement[],
    ctx: RealNodeContext,
): CytoscapeElement[] {
    const accelerator = inferAcceleratorType(ctx.hostname, ctx.hostname);

    return rawElements.map((el) => {
        if (el.group !== 'nodes') {
            return {
                ...el,
                data: {
                    ...el.data,
                    type: 'LINK',
                    label: el.data.label ?? '',
                    ip: ctx.ip,
                    port: ctx.port,
                },
            };
        }

        const id = String(el.data.id ?? el.data.name ?? '');
        const depth = Number(el.data.depth ?? 3);
        const isRoot = depth === 1 && !el.data.parent;
        let type = inferNodeTypeFromId(id, String(el.data.type ?? 'DEFAULT'));

        if (isRoot) {
            type = 'HOST';
        }

        const label = String(el.data.label ?? el.data.name ?? id);
        const data: Record<string, unknown> = {
            ...el.data,
            id,
            label,
            type,
            ip: ctx.ip,
            port: ctx.port,
            properties: { ...(el.data.properties as object), ip: ctx.ip },
        };

        if (isRoot) {
            data.fullLabel = buildRealHostFullLabel(ctx, label, accelerator);
            data.properties = {
                accelerators: accelerator,
                role: 'Core',
                ip: ctx.ip,
                hostname: ctx.hostname,
                port: ctx.port,
            };
        }

        return { ...el, data };
    });
}

export async function loadRealNodeTopology(ctx: RealNodeContext): Promise<{
    elements: CytoscapeElement[];
    cpuNum: number;
    gpuNum: number;
}> {
    try {
        await api.get('/topology/info/node', {
            params: { ip: ctx.ip, hostname: ctx.hostname, port: ctx.port },
        });
    } catch (err: unknown) {
        const msg =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            '获取节点拓扑信息失败，请检查 SSH 与 ht-smi';
        throw new Error(msg);
    }

    let cytoscapeRes;
    try {
        cytoscapeRes = await api.get('/topology/cytoscape', {
            params: { ip: ctx.ip, hostname: ctx.hostname },
        });
    } catch (err: unknown) {
        const msg =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            '从 Neo4j 获取拓扑图失败，请确认 express 与 Neo4j 已启动';
        throw new Error(msg);
    }

    const rawElements = cytoscapeRes.data?.elements;
    if (!Array.isArray(rawElements) || rawElements.length === 0) {
        throw new Error('拓扑数据为空，请确认节点在线且解析成功');
    }

    const elements = normalizeCytoscapeElements(rawElements, ctx);
    const cpuNum = elements.filter((el) => el.group === 'nodes' && el.data.type === 'CPU').length;
    const gpuNum = elements.filter((el) => el.group === 'nodes' && el.data.type === 'GPU').length;

    return { elements, cpuNum, gpuNum };
}
