// ./hooks/useGraphML.ts
// 导入 GraphML 文件
import { ref, type Ref } from 'vue'

import cytoscape from '@/utils/cytoscape'

// 防抖函数
import { useDebounceFn } from '@/utils/useDebounceFn'

// 引入 cy 样式 hook
import { useCyStyle, style } from './useCyStyle'

// 引入配置选项
import { useGraphSettings } from './useGraphSettings'
const settings = useGraphSettings()
const { markovClusteringApplied } = settings

export function useGraphML(cy: Ref<cytoscape.Core | undefined>) {
    const { updateStyle } = useCyStyle(cy)

    const fileInput = ref<HTMLInputElement | null>(null)

    const importGraphML = useDebounceFn(() => {
        console.log('importGraphML')
        if (!fileInput.value) return
        // 清空 value，确保选择同名文件也会触发 change
        fileInput.value.value = ''
        fileInput.value?.click()
    }, 300)


    const onFileChange = (evt: Event) => {
        console.log('onFileChange')
        console.log('fileInput', fileInput.value)
        const target = evt.target as HTMLInputElement
        const files = target.files
        if (!files || files.length === 0) return
        const reader = new FileReader()
        reader.readAsText(files[0])
        reader.onload = (event) => {
            const contents = event.target?.result as string
            // 调试输出
            // cy.value?.style().clear()
            cy.value?.remove('nodes')
            cy.value?.remove('edges')
            cy.value?.graphml({ layoutBy: "circle" })
            cy.value?.graphml(contents);

            updateStyle()
            console.log('导入 GraphML 完成')
            // 更新样式
            // 设置 cluster ID：Markov Clustering
            if (markovClusteringApplied.value) {
                const clusters = cy.value?.elements().markovClustering({ expandFactor: 3 })
                clusters?.forEach((cluster: any, i: number) => {
                    cluster.forEach((node: any) => node._private.data.clusterID = i)
                })
            }
        }
    }

    return {
        fileInput,
        onFileChange,
        importGraphML
    }
}