<template>
    <div id="details">
        <header class="sidebar-header">
            <div class="header-icon">📊</div>
            <h3>组件详情</h3>
        </header>

        <Transition name="slide-fade" mode="out-in" class="transition-wrapper">
            <div v-if="info" class="detail-card" :key="info.id">
                <div class="card-banner" :class="info.type.toLowerCase()">
                    <span class="type-badge">{{ info.type }}</span>
                    <el-select v-if="info.labels && info.labels.length" v-model="selectedLabel"
                        class="node-title-select">
                        <el-option v-for="item in info.labels" :key="item" :value="info.label.replace('*', item)"
                            :disabled="isSameGpu(item)">
                            {{ info.label.replace('*', item) }}
                        </el-option>
                    </el-select>

                    <!-- 无 labels → 正常显示标题 -->
                    <h4 v-else class="node-title">
                        {{ info.label }}
                    </h4>
                </div>

                <div class="detail-list">
                    <div v-for="(value, key) in formattedProperties" :key="key" class="detail-item">
                        <div class="detail-row">
                            <span class="detail-label">
                                <i class="dot" :class="key"></i>
                                {{ renderLabel(key as string) }}
                            </span>
                            <span class="detail-value" :class="{ 'status-active': value === '🟢 激活' }">
                                {{ value }}
                            </span>
                        </div>
                    </div>
                </div>
                <div v-if="fetchedData && visibleFields.length > 0" class="info-summary-wrapper">
                    <div class="summary-group">
                        <div v-for="(item, index) in visibleFields" :key="index" class="summary-item"
                            :class="item.class">
                            <span class="label">{{ item.label }}&nbsp;&nbsp;</span>
                            <span class="value">{{ item.value }}&nbsp;&nbsp;</span>
                        </div>
                    </div>
                </div>

                <div v-if="['HOST'].includes(info.type)" class="card-actions">
                    <button class="primary-action" @click="viewMonitor()">
                        <span>📈 节点内部拓扑感知</span>
                    </button>
                </div>

                <div v-if="['NET_LINK'].includes(info.type)" class="card-actions">
                    <button class="primary-action" @click="viewBetweenNodes()">
                        <span>📈 节点间拓扑感知</span>
                    </button>
                </div>

                <div v-if="['O_HOST'].includes(info.type)" class="card-actions">
                    <button class="primary-action" @click="viewBetweenNodes()">
                        <span>📈 节点间拓扑感知</span>
                    </button>
                    <button class="primary-action" @click="enterNode()">
                        <span>📈 节点内拓扑感知</span>
                    </button>
                </div>

                <div v-if="fetchedData" class="json-viewer-container">
                    <div class="json-header">
                        <span class="json-title">📋 节点原始数据</span>
                        <!-- <button @click="viewMonitor" class="close-link" v-if="props.info?.type !== 'HOST'">重新获取</button> -->
                    </div>
                    <div class="json-scroll-area">
                        <pre class="json-content">{{ JSON.stringify(fetchedData, null, 2) }}</pre>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <div class="empty-box">
                    <div class="radar-scan"></div>
                    <p>等待选择组件...</p>
                    <span>在拓扑图中点击查看详细参数</span>
                </div>
            </div>


        </Transition>

    </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { DetailInfo } from '../types/topology';
import { ElMessage } from 'element-plus';
import { useTopologyStore } from '@/stores/useIndexStore';

const { currentNodeId } = useTopologyStore();

const props = defineProps<{
    info: DetailInfo | null;
    cpuNum: number;
    gpuNum: number;
    allSshNodes: string[];
    nodesLabel: Record<string, string>;
}>();

// 新增：用于存储接口返回的原始 JSON 数据
const fetchedData = ref<any>(null);
const isLoading = ref(false);

// 新增：选中目标gpu链路标签的响应式变量
const selectedLabel = ref('');

// 属性名翻译字典
const labelMap: Record<string, string> = {
    memory: '内存容量',
    model: '型号',
    vram: '显存大小',
    bandwidth: '带宽',
    ip: 'IP 地址',
    status: '运行状态',
    pcie_gen: 'PCIe 版本',
    cores: '核心数',
    accelerators: '加速卡类型',
    role: '节点角色',
};

watch(selectedLabel, (newVal) => {
    if (newVal) {
        console.log('用户选择了：', newVal);
        // 你可以在这里更新界面、重新获取数据等
    }
});


// 合并后的可见字段列表
const visibleFields = computed(() => {
    if (!fetchedData.value) return [];
    const data = fetchedData.value;
    console.log("@@@data", data);
    const items: { label: string; value: string | number; class?: string }[] = [];
    // 如果是 HOST 类型则直接返回空items
    if (props.info?.type === 'HOST') {
        return items;
    }
    // 如果是 O_HOST 类型
    if (props.info?.type === 'O_HOST') {
        const data = fetchedData.value;

        // 初始加载状态
        if (!data || (data.loading && !data.latData?.results)) {
            console.log(!data == true, data.loading, !data.latData?.results);
            return [{ label: '状态', value: '正在初始化探测...', class: 'data-item' }];
        }

        const items: { label: string; value: string | number; class?: string }[] = [];
        const sourceLabel = props.info.label || props.info.id;

        // --- 1. 渲染时延部分 (Latency) ---
        if (data.latData && data.latData.results && data.latData.results.length > 0) {
            items.push({ label: '网络时延 (Latency)', value: '', class: 'title-category' });

            data.latData.results.forEach((res: any) => {
                const targetIp = res.target;
                const targetHostname = props.nodesLabel[targetIp] || targetIp;
                items.push({
                    label: `${sourceLabel} -> ${targetHostname}`,
                    value: res.success ? `${res.latency_ms} ms` : '测量失败',
                    class: 'data-item'
                });
            });
        }

        // --- 2. 渲染带宽部分 (Bandwidth) ---
        items.push({ label: '链路带宽 (Bandwidth)', value: '', class: 'title-category' });

        if (data.bandwidthLoading) {
            items.push({ label: '状态', value: '⚡ 正在测试吞吐量，请稍候...', class: 'data-item' });
        } else if (data.bwData.results && data.bwData.results.length > 0) {
            data.bwData.results.forEach((res: any) => {
                const targetIp = res.dest; // 注意：带宽接口返回字段是 dest
                const targetHostname = props.nodesLabel[targetIp] || targetIp;

                items.push({
                    label: `${sourceLabel} -> ${targetHostname}`,
                    value: res.success ? `${parseFloat(res.bandwidth_mbps).toFixed(2)} Mbps` : '测量失败',
                    class: 'data-item'
                });
            });
        } else {
            items.push({ label: '状态', value: '无带宽数据', class: 'data-item' });
        }

        if (data.updateTime) {
            items.push({ label: '上次更新', value: data.updateTime, class: 'data-item-tips' });
        }

        return items;
    }
    if (props.info?.type === 'NET_LINK') {
        const data = fetchedData.value;

        // 1. 彻底没有数据且不在加载时，显示等待
        if (!data || (!data.loading && !data.latDataAB && !data.bwDataAB)) {
            return [{ label: '状态', value: '等待测量数据...', class: 'data-item' }];
        }

        const items: { label: string; value: string | number; class?: string }[] = [];
        const nameA = props.nodesLabel[(props.info as any).source] || (props.info as any).source;
        const nameB = props.nodesLabel[(props.info as any).target] || (props.info as any).target;

        // --- 1. 链路时延 (双向) ---
        // 只有当至少有一个方向的时延数据成功获取后才显示分类
        if (data.latDataAB || data.latDataBA) {
            items.push({ label: '网络时延 (Latency)', value: '', class: 'title-category' });
            items.push({
                label: `${nameA} → ${nameB}`,
                value: data.latDataAB?.success ? `${data.latDataAB.latency_ms} ms` : '失败',
                class: 'data-item'
            });
            items.push({
                label: `${nameB} → ${nameA}`,
                value: data.latDataBA?.success ? `${data.latDataBA.latency_ms} ms` : '失败',
                class: 'data-item'
            });
        }

        // --- 2. 链路带宽 (双向) ---
        // 只有当“正在加载带宽”或者“已经有了带宽数据”时才显示带宽分类
        if (data.bandwidthLoading || (data.bwDataAB || data.bwDataBA)) {
            items.push({ label: '链路带宽 (Bandwidth)', value: '', class: 'title-category' });

            if (data.bandwidthLoading) {
                items.push({ label: '状态', value: '⚡ 正在测试双向吞吐量...', class: 'data-item' });
            } else if (data.isBiDirectional) {
                items.push({
                    label: `${nameA} → ${nameB}`,
                    value: data.bwDataAB?.success ? `${parseFloat(data.bwDataAB.bandwidth_mbps).toFixed(2)} Mbps` : '失败',
                    class: 'data-item'
                });
                items.push({
                    label: `${nameB} → ${nameA}`,
                    value: data.bwDataBA?.success ? `${parseFloat(data.bwDataBA.bandwidth_mbps).toFixed(2)} Mbps` : '失败',
                    class: 'data-item'
                });
            }
        }

        // --- 3. 更新时间 ---
        if (data.updateTime) {
            items.push({ label: '上次更新', value: data.updateTime, class: 'data-item-tips' });
        }

        return items;
    }

    if (data._type === 'GPU_DETAIL') {
        items.push(
            { label: '设备编号', value: data.index },
            { label: '设备名称', value: data.name },
            { label: 'PCI 域', value: data.pci_domain },
            { label: 'PCI 总线', value: data.pci_bus },
            { label: '显存', value: `${data.total_memory_gb}.0 GB` },
            { label: '支持管理工具', value: data.source }
        );
        // 基础信息展示完，直接返回，不再走后面链路逻辑
        return items;
    }

    // --- 1. CPU 节点关联的 GPU 链路 (related_gpu_to_host) ---
    if (data.related_gpu_to_host) {
        const target = data.related_gpu_to_host;
        // 获取当前点击的 CPU 索引 (例如 "CPU3" -> 3)
        const cpuIndex = parseInt(props.info?.label.match(/cpu(\d+)/)?.[1] || "0", 10);
        // 每个 CPU 对应的 GPU 数量
        const x = Math.floor(props.gpuNum / props.cpuNum);

        const metricMap: any = { bandwidth_GBps: '带宽', latency_us: '延时' };
        const unitMap: any = { bandwidth_GBps: 'GB/s', latency_us: 'us' };
        const modeMap: any = { pageable: 'Pageable (分页内存)', pinned: 'Pinned (锁页内存)' };

        for (const metric in target) {
            // 插入大类标题
            items.push({ label: `${metricMap[metric]}`, value: '', class: 'title-category' });

            for (const mode in target[metric]) {
                // 插入模式标题
                items.push({ label: `[${modeMap[mode]}]`, value: '', class: 'title-mode' });

                for (const dir in target[metric][mode]) {
                    const dataArray = target[metric][mode][dir];

                    if (Array.isArray(dataArray)) {
                        dataArray.forEach((val, i) => {
                            // 计算当前数据点对应的真实 GPU 物理编号
                            const realGpuIdx = cpuIndex * x + i;

                            // --- 核心修正点 ---
                            let labelText = '';
                            if (dir === 'H_to_D') {
                                // Host(CPU) 到 Device(GPU)
                                labelText = `CPU${cpuIndex} -> GPU${realGpuIdx} ${metricMap[metric]}`;
                            } else {
                                // Device(GPU) 到 Host(CPU)
                                labelText = `GPU${realGpuIdx} -> CPU${cpuIndex} ${metricMap[metric]}`;
                            }

                            items.push({
                                label: labelText,
                                class: 'data-item',
                                value: typeof val === 'number' ? `${val.toFixed(4)} ${unitMap[metric]}` : 'N/A'
                            });
                        });
                    }
                }
            }
        }
    }

    // --- 2. GPU 到 Host 链路 (gpu_to_host) ---
    else if (data.gpu_to_host) {
        const target = data.gpu_to_host;
        const gpuMatch = (props.info as any)?.source?.match(/gpu(\d+)/);
        console.log("处理 GPU 到 Host 链路数据，当前节点 source:", (props.info as any));
        const currentGpuIdx = gpuMatch ? gpuMatch[1] : '';

        const metricMap: any = { bandwidth_GBps: '带宽', latency_us: '延时' };
        const unitMap: any = { bandwidth_GBps: 'GB/s', latency_us: 'us' };
        const modeMap: any = { pageable: 'Pageable (分页内存)', pinned: 'Pinned (锁页内存)' };

        // 定义一个内部工具函数来安全处理数值转换
        const safeFix = (val: any) => {
            // 1. 如果是数组，取第一个元素
            const num = Array.isArray(val) ? val[0] : val;
            // 2. 转换成数字类型
            const parsed = parseFloat(num);
            // 3. 检查是否为有效数字
            return !isNaN(parsed) ? parsed.toFixed(4) : 'N/A';
        };

        for (const metric in target) {
            items.push({ label: `${metricMap[metric]}`, value: '', class: 'title-category' });

            for (const mode in target[metric]) {
                items.push({ label: `[${modeMap[mode]}]`, value: '', class: 'title-mode' });

                const directions = target[metric][mode];

                // 使用 safeFix 替代直接调用 .toFixed
                if (directions.H_to_D !== undefined && directions.H_to_D !== null) {
                    items.push({
                        label: `Host -> GPU${currentGpuIdx} ${metricMap[metric]}`,
                        value: `${safeFix(directions.H_to_D)} ${unitMap[metric]}`,
                        class: 'data-item'
                    });
                }

                if (directions.D_to_H !== undefined && directions.D_to_H !== null) {
                    items.push({
                        label: `GPU${currentGpuIdx} -> Host ${metricMap[metric]}`,
                        value: `${safeFix(directions.D_to_H)} ${unitMap[metric]}`,
                        class: 'data-item'
                    });
                }
            }
        }
    }

    // --- 3. GPU 到 GPU 链路 (gpu_to_gpu) ---
    else if (data.gpu_to_gpu) {
        const target = data.gpu_to_gpu;

        // 解析当前起始 GPU 编号 (例如 "GPU0" -> 0)
        const gpuMatch = (props.info as any)?.source?.match(/gpu(\d+)/);
        const currentGpuIdx = gpuMatch ? parseInt(gpuMatch[1], 10) : 0;

        const metricMap: any = { bandwidth_GBps: '带宽', latency_us: '延时' };
        const unitMap: any = { bandwidth_GBps: 'GB/s', latency_us: 'us' };
        const p2pStatusMap: any = { p2p_enabled: 'P2P 已启用', p2p_disabled: 'P2P 已禁用' };
        const typeMap: any = {
            unidirectional_read: '单向读取',
            unidirectional_write: '单向写入',
            bidirectional: '双向对传'
        };

        for (const metric in target) {
            // 大类标题：=== P2P 带宽 ===
            items.push({ label: `${metricMap[metric]}`, value: '', class: 'title-category' });

            for (const p2pStatus in target[metric]) {
                // 子状态标题：[P2P 已启用]
                items.push({ label: `[${p2pStatusMap[p2pStatus] || p2pStatus}]`, value: '', class: 'title-mode' });

                for (const transType in target[metric][p2pStatus]) {
                    // 这里的 matrix 是一个嵌套数组 [ [values] ]
                    const matrix = target[metric][p2pStatus][transType];

                    if (Array.isArray(matrix) && Array.isArray(matrix[0])) {

                        const selected = selectedLabel.value || '';
                        const match = selected.match(/->\s*gpu(\d+)/i);
                        const targetIdx = match ? parseInt(match[1], 10) : null;
                        const isAll = selected.includes('gpu*');
                        // matrix[0] 包含了当前 GPU 到所有 GPU 的结果
                        matrix[0].forEach((val, targetGpuIdx) => {
                            if (!isAll && targetIdx !== null && targetGpuIdx !== targetIdx) {
                                return;
                            }
                            // 过滤掉 null 值（自身或无效路径）
                            if (val !== null && val !== undefined) {
                                items.push({
                                    label: `GPU${currentGpuIdx} → GPU${targetGpuIdx} ${typeMap[transType] || transType}`,
                                    value: `${parseFloat(val).toFixed(4)} ${unitMap[metric]}`,
                                    class: 'data-item'
                                });
                            }
                        });
                    }
                }
            }
        }
    }

    return items;
});

const isSameGpu = (targetLabel: string) => {
    // 当前 source GPU（例如 gpu1）
    const sourceMatch = props.info?.label.match(/gpu(\d+)/i);
    const sourceIdx = sourceMatch ? parseInt(sourceMatch[1], 10) : null;

    // 当前 option 的 target GPU（例如 gpu1）
    const targetMatch = targetLabel.match(/gpu(\d+)/i);
    const targetIdx = targetMatch ? parseInt(targetMatch[1], 10) : null;

    return sourceIdx !== null && targetIdx !== null && sourceIdx === targetIdx;
};

// 监测info变化，修改fetchedData的值
watch(
    () => props.info,
    (newInfo: any) => {
        if (!newInfo || !originalData.value) {
            fetchedData.value = null;
            selectedLabel.value = newInfo?.label.replace('*', 'gpu*');
            // originalData.value = null;
            return;
        }
        else if (lastInfoIp.value && lastInfoIp.value !== props.info?.ip) {
            console.log("节点切换了，清除之前的原始数据", props.info, lastInfoIp.value);
            fetchedData.value = null;
            return
        }
        else if (newInfo.type === "GPU") {
            const temp = handleGPU(newInfo.label, originalData.value);
            console.log("处理 GPU 详情数据，结果是:", temp);
            fetchedData.value = { measurement_info: originalData.value.measurement_info, ...temp };
            return;
        }

        else if (newInfo.type === "HOST") {
            // 如果是 HOST 类型节点，且当前
            console.log("当前节点是 HOST，准备展示原始数据", props.info, lastInfoIp.value);
            if (lastInfoIp.value !== props.info?.ip) {
                fetchedData.value = null;
            } else {
                fetchedData.value = originalData.value;
            }
            return;
        }

        else if (newInfo.type !== "LINK") {
            // console.log("not link")
            fetchedData.value = null;
            return
        }
        console.log("当前选中的是链路，准备处理链路详情数据", newInfo);
        if (newInfo.labels) {
            selectedLabel.value = newInfo.label.replace('*', 'gpu*');
        }
        console.log("处理链路详情数据，当前 selectedLabel 是:", selectedLabel, newInfo.label);
        const source = newInfo.source.toLowerCase();
        const target = newInfo.target.toLowerCase();
        let filtered: any = {};

        if (source.includes("gpu")) {
            // GPU 的 index
            const gpuIndex = parseInt(source.match(/gpu(\d+)/)![1], 10);

            // GPU 通过 marslink 到 GPU 的带宽与延迟
            if (target.includes("marslink")) {
                filtered = {
                    gpu_to_gpu: extractGpuToGpu(originalData.value.gpu_to_gpu, gpuIndex)
                };
            }
            // GPU 通过 pci 到 Host(CPU) 的带宽与延迟
            else if (target.includes("pci")) {
                filtered = {
                    gpu_to_host: extractGpuToHost(originalData.value.gpu_to_host, gpuIndex)
                };
            }
        } else if (source.includes("cpu")) {
            // CPU 情况
            const cpuIndex = parseInt(source.match(/cpu(\d+)/)![1], 10);

            filtered = {
                cpu_info: originalData.value.cpu_info,
                // 可扩展：仅保留该 CPU 对应的 NUMA 节点或 cores 信息
                related_gpu_to_host: extractCpuRelatedGpu(originalData.value.gpu_to_host, cpuIndex, props.gpuNum, props.cpuNum),
            };
        } else {
            // 默认显示原始数据
            filtered = { ...originalData.value };
        }

        fetchedData.value = { measurement_info: originalData.value.measurement_info, ...filtered };
    },
    { deep: true }
);

/**
 * 处理 GPU 类型的详细数据提取
*/
const handleGPU = (label: string, originalData: any) => {
    if (!originalData || !originalData.gpu_metadata) {
        console.error("未找到 gpu_metadata 数据源");
        return { error: "硬件元数据缺失" };
    }

    try {
        // 1. 提取索引数字 (例如 "GPU0" -> 0)
        const match = label.match(/gpu(\d+)/i);
        if (!match) {
            return { error: `无法识别的 GPU 标识: ${label}` };
        }

        const index = parseInt(match[1], 10);
        const metadataArray = originalData.gpu_metadata;

        // 2. 安全性校验：检查数组越界
        if (!Array.isArray(metadataArray) || index >= metadataArray.length) {
            return { error: `节点 ${label} 超出硬件检测范围` };
        }

        const targetGpu = metadataArray[index];

        // 3. 返回过滤后的结构化数据
        return {
            index: targetGpu.index,
            name: targetGpu.name,
            pci_domain: targetGpu.pci_domain,
            pci_bus: targetGpu.pci_bus,
            total_memory_gb: targetGpu.total_memory_gb,
            source: targetGpu.source, // 直接保留子对象
            _type: 'GPU_DETAIL' // 内部标记位，方便模板判断
        };
    } catch (e: any) {
        console.error("handleGPU 处理出错:", e);
        return { error: "数据解析异常" };
    }
};


/**
 * 提取指定 GPU 的 GPU→GPU 链路信息
 */
function extractGpuToGpu(gpuToGpu: any, gpuIndex: number) {
    const result: any = {};

    for (const metric in gpuToGpu) {
        result[metric] = {};
        for (const p2pMode in gpuToGpu[metric]) {
            result[metric][p2pMode] = {};
            const modeObj = gpuToGpu[metric][p2pMode];

            for (const direction in modeObj) {
                const matrix: any[][] = modeObj[direction];

                // 仅保留第 gpuIndex 个列表（行）
                result[metric][p2pMode][direction] = [matrix[gpuIndex]];
            }
        }
    }

    return result;
}

/**
 * 提取指定 GPU 的 GPU→Host 链路信息
 */
/**
 * 提取特定 GPU 索引的 Host 传输数据
 * @param gpuToHost 原始的 gpu_to_host 对象
 * @param gpuIndex GPU 的索引 (0, 1, 2...)
 */
function extractGpuToHost(gpuToHost: any, gpuIndex: number) {
    if (!gpuToHost) return {};

    const result: any = {};

    // 遍历 Metric (bandwidth_GBps, latency_us)
    for (const metric in gpuToHost) {
        result[metric] = {};

        // 遍历 Mode (pageable, pinned)
        for (const mode in gpuToHost[metric]) {
            result[metric][mode] = {};

            const directions = gpuToHost[metric][mode]; // 包含 H_to_D 和 D_to_H

            // 遍历方向 (H_to_D, D_to_H)
            for (const dir in directions) {
                const arr = directions[dir];

                if (Array.isArray(arr)) {
                    // 提取该 GPU 对应的值。如果越界则返回 null 或 0
                    result[metric][mode][dir] = arr.length > gpuIndex ? arr[gpuIndex] : null;
                } else {
                    result[metric][mode][dir] = "N/A";
                }
            }
        }
    }
    return result;
}

/**
 * 提取 CPU 对应的 GPU→Host 信息
 */
function extractCpuRelatedGpu(gpuToHost: any, cpuIndex: number, gpuNum: number, cpuNum: number) {
    if (!gpuToHost) return {};

    const result: any = {};

    // 1. 计算每个 CPU 对应的 GPU 数量 (x)
    // 例如：8个GPU / 2个CPU = 每个CPU对应 4 个GPU
    const x = Math.floor(gpuNum / cpuNum);

    // 2. 计算当前 CPU 应该截取的 GPU 数组范围
    const start = cpuIndex * x;
    const end = (cpuIndex + 1) * x;

    for (const metric in gpuToHost) {
        result[metric] = {};
        for (const mode in gpuToHost[metric]) {
            const directions = gpuToHost[metric][mode];
            result[metric][mode] = {};

            for (const dir in directions) {
                const arr = directions[dir]; // 这里的 arr 长度通常等于 gpuNum

                if (Array.isArray(arr)) {
                    // 3. 使用 slice 提取该 CPU 管辖范围内的所有 GPU 数据
                    // 结果将是一个长度为 x 的数组
                    const sliceData = arr.slice(start, end);

                    // 如果截取结果为空（防止越界），给定默认值
                    result[metric][mode][dir] = sliceData.length > 0 ? sliceData : ["N/A"];
                } else {
                    result[metric][mode][dir] = ["N/A"];
                }
            }
        }
    }

    return result;
}


// 属性格式化逻辑
const formattedProperties = computed(() => {
    if (!props.info?.properties) return {};
    const entries = Object.entries(props.info.properties);

    return entries.reduce((acc, [key, val]) => {
        // 自动处理单位或布尔值
        let displayValue = val;
        if (key === 'status') displayValue = val === 'Active' ? '🟢 激活' : '🔴 异常';

        acc[key] = displayValue;
        return acc;
    }, {} as any);
});

const renderLabel = (key: string) => labelMap[key] || key;


const originalData = ref<any>(null);

const lastInfoIp = ref("")

// 修改后的查看详情函数
const viewMonitor = async () => {
    // 假设 ip 存储在 info.properties.ip 中
    console.log('节点详情的info对象:', props.info);
    const ip = props.info?.properties?.ip;
    const port = props.info?.port;
    if (!ip) {
        console.error("未找到有效的 IP 地址");
        return;
    }

    isLoading.value = true;
    fetchedData.value = { loading: `正在获取节点${ip}的拓扑感知数据，这个过程可能需要40s左右，请耐心等待` };
    try {
        const response = await fetch(`http://localhost:3000/topology/info/node/detail?ip=${ip}&port=${port}`);
        if (!response.ok) throw new Error('网络响应异常');
        const json = await response.json();
        // fetchedData.value = json; // 将获取的数据存入响应式变量
        // fetchedData.value = { success: "数据获取成功，点击组件查看相关数据" }
        fetchedData.value = json
        ElMessage.success(`节点 ${ip} 的数据获取成功, 点击查看感知信息数据！`);
        originalData.value = json;
        lastInfoIp.value = ip as string;
    } catch (error) {
        console.error("获取数据失败:", error);
        fetchedData.value = { error: "无法获取节点拓扑感知数据" };
        originalData.value = null;
    } finally {
        isLoading.value = false;
    }
    console.log('接口返回的原始数据:', fetchedData.value);
};

watch(() => props.info, (newInfo) => {
    if (!newInfo) {
        fetchedData.value = null;
        return;
    }

    let cacheKey = '';
    if (newInfo.type === 'O_HOST') {
        cacheKey = `net_topo_${newInfo.properties?.ip}`;
    } else if (newInfo.type === 'NET_LINK') {
        cacheKey = `link_topo_${newInfo.id}`;
    }

    if (cacheKey) {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
            try {
                fetchedData.value = JSON.parse(cachedStr);
            } catch (e) {
                fetchedData.value = null;
            }
        } else {
            fetchedData.value = null;
        }
    }
}, { immediate: true });

const viewBetweenNodes = async () => {
    const info = props.info;
    if (!info) return;

    let sourceIp = '';
    let targetIps = '';
    let cacheKey = '';

    // --- 1. 基础参数提取 ---
    if (info.type === 'O_HOST') {
        sourceIp = (info as any).properties.ip;
        targetIps = props.allSshNodes.filter(ip => ip !== sourceIp).join(',');
        cacheKey = `net_topo_${sourceIp}`;
    } else if (info.type === 'NET_LINK') {
        sourceIp = (info as any).source;
        targetIps = (info as any).target;
        cacheKey = `link_topo_${(info as any).id}`;
    }
    if (!sourceIp || !targetIps) return;

    isLoading.value = true;
    // 初始状态
    fetchedData.value = { loading: true, message: '正在探测双向时延...' };

    try {
        let finalData: any = {};

        if (info.type === 'NET_LINK') {
            const A = (info as any).source;
            const B = (info as any).target;

            // --- 2. 获取双向时延 ---
            // A -> B
            const latResAB = await fetch(`http://localhost:3000/network/latency?source=${A}&targets=${B}`);
            const latJsonAB = await latResAB.json();

            // B -> A
            const latResBA = await fetch(`http://localhost:3000/network/latency?source=${B}&targets=${A}`);
            const latJsonBA = await latResBA.json();

            // 先更新一次 UI，让用户看到时延数据，同时显示带宽加载中
            fetchedData.value = {
                latDataAB: latJsonAB.results[0],
                latDataBA: latJsonBA.results[0],
                bandwidthLoading: true,
                message: '正在探测双向带宽...'
            };

            // --- 3. 获取双向带宽 (顺序执行避免竞争) ---
            // A -> B
            const bwResAB = await fetch(`http://localhost:3000/network/bandwidth?source=${A}&dests=${B}`);
            const bwJsonAB = await bwResAB.json();

            // B -> A
            const bwResBA = await fetch(`http://localhost:3000/network/bandwidth?source=${B}&dests=${A}`);
            const bwJsonBA = await bwResBA.json();

            finalData = {
                success: true,
                updateTime: new Date().toLocaleString(),
                latDataAB: latJsonAB.results[0],
                latDataBA: latJsonBA.results[0],
                bwDataAB: bwJsonAB.results[0],
                bwDataBA: bwJsonBA.results[0],
                bandwidthLoading: false,
                isBiDirectional: true // 标记为双向链路数据
            };
        } else {
            // --- O_HOST (一对多) 逻辑保持不变 ---
            const latRes = await fetch(`http://localhost:3000/network/latency?source=${sourceIp}&targets=${targetIps}`);
            const latJson = await latRes.json();

            if (latJson.success) {
                fetchedData.value = { latData: latJson, bandwidthLoading: true };
            }

            const bwRes = await fetch(`http://localhost:3000/network/bandwidth?source=${sourceIp}&dests=${targetIps}`);
            const bwJson = await bwRes.json();

            finalData = {
                success: true,
                updateTime: new Date().toLocaleString(),
                latData: latJson,
                bwData: bwJson,
                bandwidthLoading: false,
            };
        }

        // --- 4. 存储与更新 ---
        if (finalData.success) {
            fetchedData.value = finalData;
            localStorage.setItem(cacheKey, JSON.stringify(finalData));
        }
    } catch (err) {
        console.error(err);
        ElMessage.error('双向探测失败');
    } finally {
        isLoading.value = false;
    }
};

const emit = defineEmits(['clearDetails']);

const enterNode = () => {
    currentNodeId.value = props.info?.id as string;
    fetchedData.value = null;
    emit('clearDetails');
}
</script>

<style scoped>
#details {
    width: 350px;
    background: #ffffff;
    border-left: 1px solid #e2e8f0;
    padding: 20px;
    display: flex;
    flex-direction: column;
    z-index: 10;
    margin-bottom: 5px;
    height: 100vh;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    height: 23px;
}

.sidebar-header h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

/* 卡片容器 */
.detail-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    align-self: flex-start;
    width: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    margin-bottom: 35px !important;
}

/* 卡片页眉横幅 */
.card-banner {
    padding: 16px;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
}

.card-banner.gpu {
    border-top: 4px solid #36A8A6;
}

.card-banner.cpu {
    border-top: 4px solid #28a745;
}

.card-banner.numa {
    border-top: 4px solid #2563eb;
}

.card-banner.host {
    border-top: 4px solid #6366f1;
}

.card-baner.default {
    border-top: 4px solid #eab308;
}


.type-badge {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 99px;
    background: rgba(0, 0, 0, 0.05);
    color: #64748b;
}

.transition-wrapper {
    flex: 1;
    display: flex;
    min-height: 0;
    margin-bottom: 5px;
}

.node-title {
    margin: 8px 0 0 0;
    font-size: 18px;
    color: #0f172a;
}

/* 列表条目 */
.detail-list {
    padding: 12px;
    padding-bottom: 0;
    padding-top: 0;
}

.detail-item {
    padding: 12px 0;
    border-bottom: 1px solid #f8fafc;
}

.detail-item:last-child {
    border-bottom: none;
}

.detail-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.detail-label {
    font-size: 12px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 6px;
}

.detail-value {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    word-break: break-all;
    margin-left: 5px;
}

.status-active {
    color: #16a34a;
}

/* 按钮样式 */
.card-actions {
    padding: 16px;
    background: #f8fafc;
}

.primary-action {
    width: 100%;
    padding: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
}

/* 第一个.primary-action */
.primary-action:first-child {
    margin-bottom: 10px;
}


.primary-action:hover {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

/* 空状态 */
.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-box {
    text-align: center;
    padding: 40px 20px;
    border: 2px dashed #e2e8f0;
    border-radius: 20px;
    width: 100%;
}

.empty-box p {
    margin: 12px 0 4px;
    font-weight: 600;
    color: #64748b;
}

.empty-box span {
    font-size: 12px;
    color: #94a3b8;
}

/* 动画 */
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}

.slide-fade-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.json-viewer-container {
    /* margin: 5px; */
    /* margin-top: 5px; */
    padding: 12px;
    padding-bottom: 5px;
    background: #f8fafc;
    /* 与卡片 Banner 一致的浅灰色 */
    border: 1px solid #e2e8f0;
    border-radius: 4px 4px 12px 12px;
    flex: 1;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 95%;
}

.json-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #e2e8f0;
}

.json-title {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
}

.close-link {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 11px;
    cursor: pointer;
    transition: color 0.2s;
}

.close-link:hover {
    color: #ef4444;
    text-decoration: underline;
}

/* 滚动区域：自定义滚动条样式 */
.json-scroll-area {
    max-height: 550px;
    overflow: auto;
    flex: 1;
    margin-bottom: 25px;
    /* 针对 Chrome/Safari 的滚动条美化 */
}

.json-scroll-area::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

.json-scroll-area::-webkit-scrollbar-track {
    background: transparent;
}

.json-scroll-area::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

.json-scroll-area::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* JSON 内容：调整代码高亮颜色为更柔和的深色系 */
.json-content {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #334155;
    /* 深灰文字 */
    white-space: pre-wrap;
    word-break: break-all;
}

.summary-group {
    display: flex;
    flex-direction: column;
    /* 垂直排列，如果想并排可以换成 row */
    gap: 8px;
    /* 条目之间的间距 */
    padding: 12px;
    background-color: #f9f9f9;
    border-radius: 4px;
    border: 1px solid #eee;
    /* margin-bottom: 15px; */
}

.summary-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 16px 14px;
    background: #fafbfc;
    border-radius: 10px;
    border: 1px solid #eaecef;
}


/* 每个条目的样式 */
.summary-item {
    display: flex;
    /* 让标签和值水平对齐 */
    font-size: 14px;
    border-bottom: 1px dashed #eee;
    /* 可选：增加虚线分隔线 */
    padding-bottom: 4px;
    /* 内部元素垂直居中 */
    align-items: center;
}

/* 🔥 1. 大类标题（=== 带宽 ===） */
.summary-item.title-category {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
    margin-top: 4px;
}

/* 🔥 2. 内存模式标题（[Pageable ...]） */
.summary-item.title-mode {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    padding-left: 8px;
    /* 左缩进制造层级 */
    border-left: 2px solid #007aff;
    margin: 6px 0 4px 0;
}

/* 🔥 3. 普通数据条目（Host -> GPU1） */
.summary-item.data-item {
    font-size: 14px;
    padding-left: 14px;
    /* 再次缩进，制造第三层 */
    border-bottom: 1px dashed #f0f0f0;
}

.summary-item.data-item span.label {
    font-weight: normal;
    color: #555;
}

.summary-item.data-item-tips {
    font-size: 14px;
    padding-left: 5px;
}

.summary-item.data-item-tips span.label {
    font-weight: bold;
    color: #0f07f6;
}

span.label {
    font-weight: bold;
    color: #555;
}

.summary-item:last-child {
    border-bottom: none;
}



span.value {
    color: #007aff;
    font-family: monospace;
}

/* .info-summary-wrapper {
    max-height: 600px;
    overflow: auto;
} */

.node-title-select option {
    background: #fff;
    color: #0f172a;
    font-size: 18px;
}
</style>

<style>
/* .node-title-select>.el-select__wrapper {
    display: block;
    font-size: 18px;
    background: transparent;
    color: #0f172a;
    border: none;
    outline: none;
    cursor: pointer;
    margin-block-start: 1.33em;
    margin-block-end: 1.33em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    font-weight: bold;
    unicode-bidi: isolate;
    margin: 0;
    margin-top: 8px;
} */
.node-title-select>.el-select__wrapper {
    background: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    margin-top: 8px;
    font-weight: bold;
    unicode-bidi: isolate;
    box-shadow: none;
    padding-left: 0;
}

.node-title-select>.el-select__wrapper:hover {
    background: transparent;
    box-shadow: none;

    span {
        color: #596147 !important;
    }
}

.node-title-select>.el-select__wrapper:focus {
    background: transparent;
    box-shadow: none;
    color: #0f172a;
}

.node-title-select>.el-select__wrapper>.el-select__selection {
    span {
        font-size: 18px;
        color: #0f172a;
    }
}
</style>