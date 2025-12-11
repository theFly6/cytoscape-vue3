// ./hooks/useJSONAction.ts
import { ref, type Ref } from 'vue'
import axios from 'axios'

// 引入 cy 实例 hook
import { useCyInstance } from '../hooks/useCyInstance'
const { cy } = useCyInstance()

// 引入样式相关 hook
import { useCyStyle } from '../hooks/useCyStyle'
const { mapClusterColors } = useCyStyle(cy)

// 防抖函数
import { useDebounceFn } from '@/utils/useDebounceFn'

import { nodeBackgroundColor, nodeShape, edgeLineColor } from '@/data/styleFunctions'


export function useNodeSelection(cy: Ref<cytoscape.Core | undefined>) {

    const handleSelect = useDebounceFn(async (ip, hostname) => {
        try {
            console.log('即将导入 Neo4j 数据')
            const res = await axios.get(`http://localhost:3000/topology/cytoscape?ip=${ip}&hostname=${hostname}`)
            const data = res.data
            console.log('导入 Neo4j 数据:', data)

            // 清空现有图
            cy.value?.elements().remove()
            cy.value?.style().clear().update()

            // 添加节点和边
            data.elements.forEach((ele: any) => {
                const position =
                    ele.group === 'nodes' && ele.data.x && ele.data.y
                        ? {
                            x: parseFloat(ele.data.x),
                            y: parseFloat(ele.data.y)
                        }
                        : undefined

                cy.value?.add({
                    group: ele.group,
                    data: ele.data,
                    position
                })
            })

            // 样式恢复
            data.style = data.style || [
                { "selector": "node", "style": {} },
                { "selector": "edge", "style": {} }
            ]
            const style = data.style.map((rule: any) => ({
                selector: rule.selector,
                style: rule.selector === 'node' ? {
                    'background-color': nodeBackgroundColor,
                    'shape': nodeShape,
                    'line-color': edgeLineColor,
                    content: rule.style?.content || 'data(name)',
                    width: rule.style?.width || 'data(width)',
                    height: rule.style?.height || 'data(height)',
                } : rule.style
            }))

            cy.value?.style(style)

            // 更新图例
            mapClusterColors()

        } catch (err) {
            console.error('导入 Neo4j 数据失败', err)
        }
    }, 300)

    const handleTopoConfig = useDebounceFn(async (ip, hostname) => {
        try {
            console.log('即将获取目标ip拓扑配置', ip, hostname)
            // 根据ip和hostname获取目标ip的拓扑信息并传入neo4j中
            await axios.get('http://localhost:3000/topology/info/node?ip=' + ip + '&hostname=' + hostname)
            // 从neo4j获取拓扑结构并绘图
            handleSelect(ip, hostname)
        }
        catch (err) {
            console.error('获取目标ip拓扑配置失败', err)
        }
    }, 300)

    return {
        // handleSelect,
        handleTopoConfig
    }
}