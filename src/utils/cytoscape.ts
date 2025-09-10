import cytoscape from 'cytoscape'
import viewUtilities from 'cytoscape-view-utilities'
import graphml from 'cytoscape-graphml'
import layoutUtilities from 'cytoscape-layout-utilities'
import cise from 'cytoscape-cise'
import $ from 'jquery'
import expandCollapse from 'cytoscape-expand-collapse'

window.$ = $   // 全局挂载
window.xml = {}
window.$xml = {}
window.$graphs = {}

graphml(cytoscape, $)
expandCollapse(cytoscape)

cytoscape.use(viewUtilities)
cytoscape.use(layoutUtilities)
cytoscape.use(cise)


export default cytoscape
