// ./hooks/useNodeInfo.ts
import { ref, type Ref } from 'vue'
import axios from 'axios'

// 全局存储当前节点信息页显示的节点ID
export const nodeInfoID: Ref<string | null> = ref(null)

// 控制抽屉显示
export const drawerVisible = ref(false)

// 节点信息数据
export const nodeData = ref<any>(null)

export function useNodeInfo() {
    const loading = ref(false)
    const error = ref()

    async function fetchNodeInfo(nodeID: string) {
        nodeInfoID.value = nodeID
        loading.value = true
        error.value = null
        try {
            const res = await axios.get(`http://localhost:3000/topology/info/${nodeID}`, {
                timeout: 1000
            })
            nodeData.value = res.data
        } catch (e: any) {
            error.value = e
        } finally {
            loading.value = false
        }
    }

    return { loading, error, fetchNodeInfo }
}