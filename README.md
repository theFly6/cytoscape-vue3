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

## 本地开发（双平台）

前端始终指向本机 express：`VITE_API_BASE=http://localhost:3000`（见 [.env.example](.env.example)）。

### MetaX mx17（express 本机 + topo-server 在集群）

1. mx17 上启动 topo-server：`./run.sh start`（路径 `/home/yaowenxuan/topo-server`）
2. 本机 SSH 隧道：`ssh -L 4000:192.168.162.17:4000 -p 14735 yaowenxuan@metax-17-jump`
3. 本机启动 [cytoscape-express](https://github.com/theFly6/cytoscape-express)：`SERVER_URL_BASE=127.0.0.1:4000`
4. 本仓 `npm run dev`

完整步骤：[topo-server/deploy/platforms/metax/README.md](https://github.com/theFly6/topo-server/blob/main/deploy/platforms/metax/README.md)

### 天津 tj-24（express 在远端 tj-24）

1. SSH 隧道：`ssh -L 3000:127.0.0.1:3000 tj-24`
2. 本仓 `npm run dev`（无需本机 express）

完整步骤：[topo-server/deploy/tj/README.md](https://github.com/theFly6/topo-server/blob/main/deploy/tj/README.md)

## 构建

```sh
npm run build
```

## License

MIT
