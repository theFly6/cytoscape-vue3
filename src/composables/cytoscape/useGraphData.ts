// src/composables/useGraphData.ts
import { ref } from 'vue'
import { fullColorHex } from '@/data/cytoscape-data'

interface GraphData {
  elements: any[]
  clusters: string[][]
  layoutOptions: any
  style: any[]
}

export function useGraphData(apiUrl: string) {
  const elements = ref<any[]>([])
  const clusters = ref<string[][]>([])
  const layoutOptions = ref<any>({})
  const style = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // —— 动态加函数
  const addFunctionsToStyle = (rawStyle: any[]): any[] => {
    return rawStyle.map((rule: any) => {
      if (rule.selector === 'node') {
        return {
          ...rule,
          style: {
            ...rule.style,
            'background-color': (ele: any) => {
              let colors = ele.data('color')
              if (!colors) return
              colors = colors.split(" ")
              return '#' + fullColorHex(colors[0], colors[1], colors[2])
            },
            'shape': (ele: any) => {
              let str = '' + ele.data('shape')
              return str.toLowerCase()
            }
          }
        }
      } else if (rule.selector === 'edge') {
        return {
          ...rule,
          style: {
            ...rule.style,
            'line-color': (ele: any) => {
              let source = ele.source()
              let sColors = source.data('color')
              if (!sColors) return
              sColors = sColors.split(" ")
              const sRgbColor = '#' + fullColorHex(sColors[0], sColors[1], sColors[2])

              let target = ele.target()
              let tColors = target.data('color').split(" ")
              const tRgbColor = '#' + fullColorHex(tColors[0], tColors[1], tColors[2])

              return sRgbColor === tRgbColor ? sRgbColor : '#756D76'
            }
          }
        }
      } else {
        return rule
      }
    })
  }

  const fetchGraphData = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) throw new Error('Failed to fetch graph data')
      const data: GraphData = await response.json()

      elements.value = data.elements
      clusters.value = data.clusters
      layoutOptions.value = data.layoutOptions
      style.value = addFunctionsToStyle(data.style)
    } catch (err: any) {
      error.value = err.message
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  return {
    elements,
    clusters,
    layoutOptions,
    style,
    loading,
    error,
    fetchGraphData
  }
}
