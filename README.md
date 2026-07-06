# cytoscape-vue3

GPU / 集群拓扑可视化前端（Vue 3 + Cytoscape.js）。

| 组件 | GitHub |
|------|--------|
| 前端（本仓） | https://github.com/theFly6/cytoscape-vue3 |
| BFF | https://github.com/theFly6/cytoscape-express |
| 探测层 | https://github.com/theFly6/topo-server |

**Tag：`release-20250706-tj`** · 发布说明：[topo-server/docs/release-20250706-tj.md](https://github.com/theFly6/topo-server/blob/main/docs/release-20250706-tj.md)

## 功能

- 侧边栏节点清单与子网 Overall 视图
- 单节点 CPU / GPU / NUMA / 链路拓扑
- 节点内 / 节点间拓扑感知（时延 + iperf3 带宽，边标签缓存）
- Mock 演示拓扑

## 本地开发

完整联调（express 隧道、双平台）见 **[topo-server/docs/local-dev.md](https://github.com/theFly6/topo-server/blob/main/docs/local-dev.md)**。

```powershell
copy .env.example .env   # VITE_API_BASE=http://localhost:3000
npm install
npm run dev
```

## 构建

```sh
npm run build
```

## License

MIT
