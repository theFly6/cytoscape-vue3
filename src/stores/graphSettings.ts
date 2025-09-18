// src/stores/graphSettings.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGraphSettings = defineStore('graphSettings', () => {
  const animationType = ref<'end' | 'during'>('end')
  const nodeSeparation = ref(12.5)
  const allowNodesInCircles = ref(false)
  const maxRatioOfNodesInCircle = ref(0.1)
  const idealEdgeLengthCoef = ref(1.4)
  const packComponents = ref(true)
  const randomize = ref(true)
  const fit = ref(true)
  const markovClusteringApplied = ref(true)
  const isFormOpen = ref(false)

  return {
    animationType,
    nodeSeparation,
    allowNodesInCircles,
    maxRatioOfNodesInCircle,
    idealEdgeLengthCoef,
    packComponents,
    randomize,
    fit,
    markovClusteringApplied,
    isFormOpen
  }
})
