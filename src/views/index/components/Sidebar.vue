<template>
    <div id="sidebar">
        <header class="sidebar-header">
            <div class="logo-box">
                <div class="logo-inner"></div>
            </div>
            <h2>拓扑感知控制台</h2>
        </header>

        <div class="scroll-content">
            <section class="control-section">
                <div class="section-tag">节点选择</div>
                <div class="control-group">
                    <div class="select-wrapper">
                        <select id="node-select" :value="currentNodeId" @change="onSelectChange">
                            <option v-for="option in nodes" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <button class="reload-btn" @click="$emit('reload')">
                        <span class="icon">🔄</span>
                        重载拓扑结构
                    </button>
                </div>
            </section>

            <div class="divider"></div>

            <section class="legend-section">
                <div class="section-tag">图例说明</div>
                <div class="legend-container">
                    <div v-for="item in LegendData" :key="item.color" class="legend-card">
                        <div class="legend-marker" :style="{ backgroundColor: '#ffffff', color: item.color }">
                            {{ item.text }}
                        </div>
                        <div class="legend-info">
                            <span class="legend-label">{{ item.label }}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <footer class="sidebar-footer">
            v2.4.0-Stable
        </footer>
    </div>
</template>

<script setup lang="ts">
import { LegendData } from '@/data/index-data';
import { useTopologyStore } from '@/stores/useIndexStore';
// 使用共享 store
const { nodes, currentNodeId, fetchNodes } = useTopologyStore();

import { onMounted, ref } from 'vue';


const emit = defineEmits(['reload', 'clearDetails']);

const onSelectChange = (e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    currentNodeId.value = val;
    emit('clearDetails');
};

onMounted(async () => {
    fetchNodes();
});
</script>

<style scoped>
#sidebar {
    width: 260px;
    background: #ffffff;
    border-right: 1px solid #edf2f7;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: all 0.3s ease;
}

/* 头部 Header 优化 */
.sidebar-header {
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
}


.logo-box {
    width: 32px;
    height: 32px;
    background: #2563eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-inner {
    width: 14px;
    height: 14px;
    border: 2.5px solid #fff;
    border-radius: 50%;
}

h2 {
    font-size: 19px;
    font-weight: 800;
    color: #1a202c;
    margin: 0;
    letter-spacing: -0.5px;
}

/* 滚动区域 */
.scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px;
}

/* 区块标签 */
.section-tag {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
}

.control-section,
.legend-section {
    padding: 10px 0;
}

/* 下拉框 Wrapper */
.select-wrapper {
    position: relative;
    margin-bottom: 12px;
}

select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #f1f5f9;
    border-radius: 12px;
    background: #f8fafc;
    font-size: 14px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    appearance: none;
    transition: all 0.2s;
    background-image: url("data:image/svg+xml,...");
    /* 保持原有的 SVG */
}

select:hover {
    border-color: #e2e8f0;
    background: #fff;
}

select:focus {
    border-color: #2563eb;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

/* 按钮优化 */
.reload-btn {
    width: 100%;
    padding: 12px;
    background: #4A6591;
    /* 深色按钮更有高级感 */
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.reload-btn:hover {
    background: #435275;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.divider {
    height: 1px;
    background: #f1f5f9;
    margin: 20px 0;
}

/* 图例卡片化设计 */
.legend-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.legend-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid transparent;
    transition: all 0.2s;
}

.legend-card:hover {
    background: #fff;
    border-color: #e2e8f0;
    transform: translateX(4px);
}

.legend-marker {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
}

.legend-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

/* 页脚 */
.sidebar-footer {
    padding: 20px;
    font-size: 11px;
    color: #cbd5e1;
    text-align: center;
}

.legend-marker {
    font-size: 18px;
}

/* 让最后一个.legend-marker文字大小为28px */
.legend-card:last-child .legend-marker {
    font-size: 28px;
}
</style>