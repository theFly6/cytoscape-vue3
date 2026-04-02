export const topologyData = {
    "global_network": [
        // --- 核心层 (Spine Layer) ---
        { data: { id: 'sw_spine', label: 'Core Spine Switch', type: 'SWITCH', properties: { model: 'NVIDIA QM9700', role: 'Core' } } },

        // --- 接入层 (Access/Edge Layer) ---
        { data: { id: 'sw_edge_agg', label: 'Edge Access SW', type: 'SWITCH', properties: { model: 'Industrial Switch', location: 'Rack-02' } } },

        // --- 高性能节点 (直接连核心) ---
        { data: { id: 'node_ai_01', label: 'AI-Training-01', type: 'HOST', properties: { ip: '192.168.1.10' } } },
        { data: { id: 'node_hpc_02', label: 'HPC-Compute-02', type: 'HOST', properties: { ip: '192.168.1.11' } } },

        // --- 边缘节点 (连接到接入交换机) ---
        { data: { id: 'node_edge_03', label: 'Edge-Device-03', type: 'HOST', properties: { ip: '192.168.1.12' } } },
        { data: { id: 'node_edge_04', label: 'Edge-Device-04', type: 'HOST', properties: { ip: '192.168.1.13' } } },
        { data: { id: 'node_edge_05', label: 'Edge-Device-05', type: 'HOST', properties: { ip: '192.168.1.14' } } },

        // --- 拓扑连接关系 ---

        // 1. 跨层级连接 (Spine to Access)
        { data: { source: 'sw_edge_agg', target: 'sw_spine', label: '100G Uplink', type: 'NET_LINK' } },

        // 2. 核心节点连接
        { data: { source: 'node_ai_01', target: 'sw_spine', label: '400G RoCE', type: 'NET_LINK' } },
        { data: { source: 'node_hpc_02', target: 'sw_spine', label: '200G IB', type: 'NET_LINK' } },

        // 3. 边缘节点连接到接入交换机 (深一层结构)
        { data: { source: 'node_edge_03', target: 'sw_edge_agg', label: '10G Eth', type: 'NET_LINK' } },
        { data: { source: 'node_edge_04', target: 'sw_edge_agg', label: '1G Eth', type: 'NET_LINK' } },
        { data: { source: 'node_edge_05', target: 'sw_edge_agg', label: '1G Eth', type: 'NET_LINK' } }
    ],
    "node_ai_01": [
        // --- NUMA 域 ---
        { data: { id: 'n0', label: 'NUMA 0', type: 'NUMA', properties: { memory: '256GB' } } },
        { data: { id: 'n1', label: 'NUMA 1', type: 'NUMA', properties: { memory: '256GB' } } },

        // --- CPU 组件 ---
        { data: { id: 'cpu0', parent: 'n0', label: 'CPU 0', type: 'CPU', properties: { model: 'Epyc 7763' } } },
        { data: { id: 'cpu1', parent: 'n1', label: 'CPU 1', type: 'CPU', properties: { model: 'Epyc 7763' } } },

        // --- NVSwitch 中心节点 (新增) ---
        { data: { id: 'nvswitch', label: 'NVSwitch Fabric', type: 'SWITCH', properties: { bandwidth: '900GB/s', version: '3.0' } } },

        // --- GPU 组件 ---
        { data: { id: 'gpu0', parent: 'n0', label: 'H100-A', type: 'GPU', properties: { vram: '80GB' } } },
        { data: { id: 'gpu1', parent: 'n1', label: 'H100-B', type: 'GPU', properties: { vram: '80GB' } } },
        { data: { id: 'gpu2', parent: 'n0', label: 'H101-A', type: 'GPU', properties: { vram: '80GB' } } },
        { data: { id: 'gpu3', parent: 'n1', label: 'H101-B', type: 'GPU', properties: { vram: '80GB' } } },
        { data: { id: 'gpu4', parent: 'n0', label: 'H102-A', type: 'GPU', properties: { vram: '80GB' } } },
        { data: { id: 'gpu5', parent: 'n1', label: 'H102-B', type: 'GPU', properties: { vram: '80GB' } } },
        { data: { id: 'gpu6', parent: 'n0', label: 'H103-A', type: 'GPU', properties: { vram: '80GB' } } },
        { data: { id: 'gpu7', parent: 'n1', label: 'H103-B', type: 'GPU', properties: { vram: '80GB' } } },

        // --- 互联关系 ---
        // CPU 互联
        { data: { source: 'n0', target: 'n1', label: 'Infinity Fabric', type: 'LINK' } },

        // GPU 通过 NVSwitch 互联 (取代原有的 GPU 直连)
        { data: { source: 'gpu0', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } },
        { data: { source: 'gpu1', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } },
        { data: { source: 'gpu2', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } },
        { data: { source: 'gpu3', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } },
        { data: { source: 'gpu4', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } },
        { data: { source: 'gpu5', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } },
        { data: { source: 'gpu6', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } },
        { data: { source: 'gpu7', target: 'nvswitch', label: 'NVLink 4.0', type: 'NV_LINK' } }
    ],
    "node_hpc_02": [ // HPC 节点：四路 CPU，通过环形链路互联，无 GPU
        { data: { id: 'n0', label: 'NUMA 0', type: 'NUMA' } },
        { data: { id: 'n1', label: 'NUMA 1', type: 'NUMA' } },
        { data: { id: 'n2', label: 'NUMA 2', type: 'NUMA' } },
        { data: { id: 'n3', label: 'NUMA 3', type: 'NUMA' } },
        { data: { id: 'cpu0', parent: 'n0', label: 'Core-0', type: 'CPU' } },
        { data: { id: 'cpu1', parent: 'n1', label: 'Core-1', type: 'CPU' } },
        { data: { id: 'cpu2', parent: 'n2', label: 'Core-2', type: 'CPU' } },
        { data: { id: 'cpu3', parent: 'n3', label: 'Core-3', type: 'CPU' } },
        { data: { source: 'n0', target: 'n1', label: 'UPI', type: 'LINK' } },
        { data: { source: 'n1', target: 'n2', label: 'UPI', type: 'LINK' } },
        { data: { source: 'n2', target: 'n3', label: 'UPI', type: 'LINK' } },
        { data: { source: 'n3', target: 'n0', label: 'UPI', type: 'LINK' } }
    ],
    "node_edge_03": [ // 边缘节点：单 NUMA，只有一个 CPU 和一个网卡
        { data: { id: 'n0', label: 'System-on-Chip', type: 'NUMA', properties: { arch: 'ARM v8' } } },
        { data: { id: 'cpu0', parent: 'n0', label: 'Cortex-A72', type: 'CPU' } },
        { data: { id: 'nic0', label: 'Eth0', type: 'PCIe', properties: { speed: '1Gbps' } } },
        { data: { source: 'nic0', target: 'n0', label: 'Internal Bus', type: 'LINK' } }
    ],
    "node_edge_04": [
        // NUMA 容器
        { data: { id: 'n0', label: 'NUMA 0', type: 'NUMA' } },
        { data: { id: 'n1', label: 'NUMA 1', type: 'NUMA' } },

        // CPU 节点
        { data: { id: 'cpu0', parent: 'n0', label: 'CPU Socket 0', type: 'CPU', properties: { model: 'Xeon Platinum' } } },
        { data: { id: 'cpu1', parent: 'n1', label: 'CPU Socket 1', type: 'CPU', properties: { model: 'Xeon Platinum' } } },

        // QPI/UPI 连接 (CPU 直接对等互联)
        {
            data: {
                source: 'cpu0',
                target: 'cpu1',
                label: 'QPI/UPI Link',
                type: 'QPI',
                properties: { bandwidth: '10.4 GT/s', lanes: '20' }
            }
        }
    ],
    "node_edge_05": [
        // --- NUMA 域 (容器) ---
        { data: { id: 'n0', label: 'NUMA Node 0', type: 'NUMA', properties: { memory: '512GB DDR5', local_cpus: '0-31' } } },
        { data: { id: 'n1', label: 'NUMA Node 1', type: 'NUMA', properties: { memory: '512GB DDR5', local_cpus: '32-63' } } },

        // --- CPU 组件 (放置在对应的 NUMA 中) ---
        { data: { id: 'cpu0', parent: 'n0', label: 'CPU Socket 0', type: 'CPU', properties: { model: 'Xeon Platinum 8480+', cores: 56, threads: 112 } } },
        { data: { id: 'cpu1', parent: 'n1', label: 'CPU Socket 1', type: 'CPU', properties: { model: 'Xeon Platinum 8480+', cores: 56, threads: 112 } } },

        // --- GPU 组件 (高性能计算核心) ---
        { data: { id: 'gpu0', parent: 'n0', label: 'NVIDIA H100-A', type: 'GPU', properties: { vram: '80GB HBM3', pcie_gen: '5.0 x16' } } },
        { data: { id: 'gpu1', parent: 'n1', label: 'NVIDIA H100-B', type: 'GPU', properties: { vram: '80GB HBM3', pcie_gen: '5.0 x16' } } },

        // --- PCIe 设备 (如高性能网卡) ---
        { data: { id: 'nic0', parent: 'n0', label: 'ConnectX-7 NIC', type: 'PCIe', properties: { speed: '400GbE', protocol: 'InfiniBand/Ethernet' } } },

        // --- 互联关系 (Edges) ---

        // 1. QPI/UPI: CPU 之间的点对点高速总线
        {
            data: {
                id: 'link_qpi', source: 'cpu0', target: 'cpu1',
                label: 'UPI Link (32GT/s)', type: 'QPI',
                properties: { lanes: 24, status: 'Active' }
            }
        },

        // 2. NVLink: GPU 之间的数据交换通道
        {
            data: {
                id: 'link_nvlink', source: 'gpu0', target: 'gpu1',
                label: 'NVLink (900GB/s)', type: 'LINK',
                properties: { generation: '4.0' }
            }
        },

        // 3. PCIe Bus: 内部设备到 CPU/NUMA 的连接
        { data: { source: 'nic0', target: 'cpu0', label: 'PCIe 5.0 x16', type: 'PCIe_LINK' } },
        { data: { source: 'gpu0', target: 'cpu0', label: 'PCIe 5.0 x16', type: 'PCIe_LINK' } },
        { data: { source: 'gpu1', target: 'cpu1', label: 'PCIe 5.0 x16', type: 'PCIe_LINK' } }
    ]
};

export const LegendData = {
    "NUMA": { label: "NUMA", color: '#e1f5fe', shape: 'round-rectangle', text: "■" },
    "CPU": { label: "CPU", color: '#f7df8f', shape: 'round-rectangle', text: "■" },
    "GPU": { label: "GPU", color: '#36A8A6', shape: 'round-rectangle', text: "■" },
    "PCIe": { label: "PCIe", color: '#ffc107', shape: 'diamond', text: "◆" },
    "NIC": { label: "NIC", color: '#d6f13b', shape: 'circle', text: "●" },
    "DEFAULT": { label: "DEFAULT", color: '#e68a8a', shape: 'round-rectangle', text: "■" }
}

export const typeData = [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'color': '#000',
            'background-color': '#999',
            'font-size': '14px'
        }
    },
    {
        selector: 'node[type="NUMA"]',
        style: {
            'background-color': "#e1f5fe",
            'border-width': 2,
            'border-color': '#007bff',
            'shape': LegendData.NUMA.shape,
            'border-style': 'dashed',
            'text-valign': 'top',
            'padding': '30px'
        }
    },
    {
        selector: 'node[type="CPU"]',
        style: { 'background-color': LegendData.CPU.color, 'shape': LegendData.CPU.shape, 'width': 50, 'height': 50 }
    },
    {
        selector: 'node[type="GPU"]',
        style: { 'background-color': LegendData.GPU.color, 'shape': LegendData.GPU.shape, 'width': 70, 'height': 50 }
    },
    {
        selector: 'node[type="PCIe"]',
        style: { 'background-color': LegendData.PCIe.color, 'shape': LegendData.PCIe.shape, 'width': 80, 'height': 50 }
    },
    {
        selector: 'node[type="NIC"]',
        style: { 'background-color': LegendData.NIC.color, 'shape': LegendData.NIC.shape, "width": 50, "height": 50 }
    },
    {
        selector: 'node[type="DEFAULT"]',
        style: { 'background-color': LegendData.DEFAULT.color, 'shape': LegendData.DEFAULT.shape, 'width': 50, 'height': 50 }
    },
    {
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': '#cbd5e1',
            'curve-style': 'bezier', // 默认为贝塞尔曲线，方便设置弧度
            'control-point-step-size': 40, // 多个连接时的间距
            'target-arrow-shape': 'none',
            'label': 'data(label)',
            'font-size': '10px',
            'color': '#64748b',
            'text-background-opacity': 1,
            'text-background-color': '#ffffff',
            'text-background-padding': '2px',
            'text-margin-y': -10
        }
    },
    {
        selector: 'edge[type="QPI"]',
        style: {
            'width': 5,
            'line-color': '#8b5cf6',
            'line-style': 'solid',
            // 使用 taxi 风格实现阶梯状直角连接
            // 'curve-style': 'taxi',
            // 'taxi-direction': 'vertical',
            // 'taxi-turn': '20px',
            'ghost': 'yes', // 开启重影效果，增加立体感
            'ghost-offset-x': 0,
            'ghost-offset-y': 1,
            'ghost-opacity': 0.2
        }
    },
    {
        selector: 'edge[type="LINK"]', // 比如 NVLink
        style: {
            'width': 4,
            'line-color': '#f97316',
            'curve-style': 'unbundled-bezier', // 手动控制弯曲
            'control-point-distances': [50],   // 向上弯曲 50 像素
            'control-point-weights': [0.5]      // 在线条中点处弯曲
        }
    },
    {
        selector: 'edge[type="PCIe_LINK"]',
        style: {
            'width': 2,
            'line-color': '#f59e0b',
            'line-style': 'dashed', // 虚线效果
            'dash-pattern': [6, 3], // 6像素实线，3像素空白
            'curve-style': 'haystack' // 最简单的直线，性能最好
        }
    },
    // 下面三个是节点间的特殊样式
    {
        selector: 'node[type="SWITCH"]',
        style: {
            'background-color': '#fff',
            'shape': 'orthogonal-rectangle',
            'border-width': 3,
            'border-color': 'black',
            'width': 140,
            'height': 30,
            'font-weight': 'bold'
        }
    },
    {
        selector: 'node[type="HOST"]',
        style: {
            'border-width': 3,
            'background-color': '#e1f5fe',
            'border-color': '#007bff',
            'shape': 'round-rectangle',
            'width': 160,
            'height': 80,
            'label': 'data(fullLabel)',
            'text-wrap': 'wrap',        // 允许换行
            'text-max-width': 140,      // 每行最大宽度
            'text-valign': 'center',    // 文字居中
            'text-halign': 'center',
            'font-size': '11px',
            'line-height': 1.4,         // 行间距
        }
    },
    {
        selector: 'edge[type="NET_LINK"]',
        style: {
            'width': 4,
            'line-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#94a3b8',
            'curve-style': 'bezier'
        }
    }
]
