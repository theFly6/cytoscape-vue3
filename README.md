# cytoscape-vue3

GPU / 集群拓扑可视化前端（Vue 3 + Cytoscape.js）。与 BFF 和探测层配合，支持单节点拓扑、子网拓扑、节点内/节点间拓扑感知。

## 相关仓库

| 组件 | GitHub |
|------|--------|
| 前端（本仓） | https://github.com/theFly6/cytoscape-vue3 |
| BFF | https://github.com/theFly6/cytoscape-express |
| 探测层 | https://github.com/theFly6/topo-server |

当前里程碑 Tag：**`release-20250706-tj`**（tj-24 平台）。发布说明见 [topo-server/docs/release-20250706-tj.md](https://github.com/theFly6/topo-server/blob/main/docs/release-20250706-tj.md)。

## 功能概览

- 侧边栏节点清单与子网 Overall 视图
- 单节点 CPU / GPU / NUMA / 链路拓扑
- **节点内拓扑感知**（topo-profiler 带宽/时延矩阵）
- **节点间拓扑感知**（时延 + iperf3 带宽，结果缓存与边标签）
- Mock 演示拓扑（`global_network`、`node_ai_01`）

## 本地开发

```sh
npm install
cp .env.example .env
# VITE_API_BASE=http://localhost:3000
npm run dev
```

联调 tj-24 时先建 SSH 隧道：

```powershell
ssh -L 3000:127.0.0.1:3000 tj-24
```

## 构建

```sh
npm run build
```

## License

MIT
