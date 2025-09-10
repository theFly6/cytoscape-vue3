// ./hooks/useGraphSettings.ts
import { ref, type Ref } from 'vue'

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

export const useGraphSettings = () => {
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
}
