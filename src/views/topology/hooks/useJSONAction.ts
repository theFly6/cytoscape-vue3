// ./hooks/useJSONAction.ts
import { ref, type Ref } from 'vue'
import axios from 'axios'

// 引入 cy 实例 hook
import { useCyInstance } from '../hooks/useCyInstance'
const { cy } = useCyInstance()

// 引入样式相关 hook
import { useCyStyle } from '../hooks/useCyStyle'
const { mapClusterColors } = useCyStyle(cy)

// 引入layoutUtilities布局相关 hook
// import { useCyLayout } from '../hooks/useCyLayout'
// const { runCiseLayout } = useCyLayout(cy)

// 防抖函数
import { useDebounceFn } from '@/utils/useDebounceFn'

const importInput = ref<HTMLInputElement>()
import { nodeBackgroundColor, nodeShape, edgeLineColor, rgbToNumberString, capitalize, convertFontToCustomString } from '@/data/styleFunctions'


export function useJSONAction(cy: Ref<cytoscape.Core | undefined>) {

    const importNeo4jData = useDebounceFn(async () => {
        try {
            const res = await axios.get('http://localhost:3000/topology/cytoscape')
            const data = res.data

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
                    content: rule.style?.content || 'data(id)',
                    width: rule.style?.width || 'data(width)',
                    height: rule.style?.height || 'data(height)',
                } : rule.style
            }))

            cy.value?.style(style)

            // 更新图例
            mapClusterColors()

            cy.value?.layout({ name: 'cise' }).run()

            console.log('导入 Neo4j 数据成功')
        } catch (err) {
            console.error('导入 Neo4j 数据失败', err)
        }
    }, 300)

    const importGraphConfig = useDebounceFn((evt: Event) => {
        console.log("importGraphConfig")
        const target = evt.target as HTMLInputElement
        const files = target.files
        if (!files || files.length === 0) return

        const reader = new FileReader()
        reader.readAsText(files[0])
        reader.onload = async (event) => {
            try {
                const contents = event.target?.result as string
                const data = JSON.parse(contents)

                // 清空现有图
                cy.value?.elements().remove()
                cy.value?.style().clear().update()

                // 添加节点和边
                data.elements.forEach((ele: any) => {
                    // 将 position 从 data 中提取出来
                    const position =
                        ele.group === 'nodes' && ele.data.x && ele.data.y
                            ? {
                                x: parseFloat(ele.data.x),
                                y: parseFloat(ele.data.y)
                            }
                            : undefined
                    console.log('添加元素:', ele, position, ele.data.x, typeof ele.data.x);
                    cy.value?.add({
                        group: ele.group,
                        data: ele.data,
                        position // 只有是 node 并且 x/y 存在才添加
                    })
                })

                // 恢复样式，函数样式从库中恢复
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
                        content: rule.style?.content || 'data(id)',
                        width: rule.style?.width || 'data(width)',
                        height: rule.style?.height || 'data(height)',
                    } : rule.style
                }))
                console.log('应用样式:', style);
                // 更新 Cytoscape 样式
                cy.value?.style(style)

                // 根据簇颜色更新legend
                mapClusterColors();

                // 重新布局
                // cy.value?.layout({ name: 'concentric' }).run()
            } catch (err) {
                console.error('导入配置失败', err)
            }
        }
    }, 300)

    const exportGraphConfig = useDebounceFn(async () => {
        if (!cy.value) return

        // 1. 导出所有元素（节点和边）
        const elementsToExport = cy.value.elements().map(ele => {
            const data = { ...ele.data() }

            if (ele.isNode()) {
                const pos = ele.position()

                Object.assign(data, {
                    // 位置：转为字符串
                    x: String(Math.round(pos.x)),
                    y: String(Math.round(pos.y)),

                    // 样式：全部转字符串（或你想要的格式）
                    width: parseFloat(ele.style('width'))?.toString() || '30',
                    height: parseFloat(ele.style('height'))?.toString() || '30',
                    color: rgbToNumberString(ele.style('background-color')),
                    borderColor: rgbToNumberString(ele.style('border-color')),
                    textColor: rgbToNumberString(ele.style('color')),
                    shape: capitalize(ele.style('shape')) || 'Rectangle',
                    text: data.text ?? '',
                    textFont: convertFontToCustomString(ele.style('font-family'))
                })
            }

            return {
                group: ele.group(),
                data
            }
        })

        // 2. 导出当前 style（将函数样式替换为字符串标记）
        const styleToExport = cy.value.style().json().map(rule => {
            const cleanedStyle = Object.fromEntries(
                Object.entries(rule.style).map(([k, v]) => {
                    if (typeof v === 'function') {
                        return [k, '[function]']  // 标记为函数，无法序列化
                    }
                    return [k, v]
                })
            )
            if (rule.selector === 'node') {
                cleanedStyle['background-color'] = nodeBackgroundColor
                cleanedStyle['shape'] = nodeShape
                cleanedStyle['content'] = 'data(id)'
                cleanedStyle['width'] = 'data(width)'
                cleanedStyle['height'] = 'data(height)'
            }
            return {
                selector: rule.selector,
                style: cleanedStyle
            }
        })

        // 3. 构造导出对象
        const exportData = {
            elements: elementsToExport,
            style: styleToExport,
        }
        const jsonStr = JSON.stringify(exportData, null, 2)
        console.log('导出数据：', jsonStr)

        // 4. 生成 blob 下载
        // const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        // const url = URL.createObjectURL(blob)

        // const a = document.createElement('a')
        // a.href = url
        // a.download = 'graph.json'
        // a.click()
        // URL.revokeObjectURL(url)

        // 4. 使用 showSaveFilePicker 让用户选择文件名和路径
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: 'o.json',
                types: [
                    {
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    },
                ],
            })

            const writable = await handle.createWritable()
            await writable.write(jsonStr)
            await writable.close()
            console.log('导出成功')
        } catch (err) {
            console.warn('导出被取消或失败', err)
        }
    }, 300)

    return { importGraphConfig, importInput, exportGraphConfig, importNeo4jData }
}
