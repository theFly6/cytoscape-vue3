import { createRouter, createWebHistory } from 'vue-router'
import CytoscapePage from '../views/cytoscape/CytoscapePage.vue'
import GraphmlPage from '../views/graphml/GraphmlPage.vue'
import PlayGround from '../views/playground/PlayGround.vue'
import TopologyPage from '../views/topology/TopologyPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: TopologyPage,
    },
    {
      path: '/cytoscape',
      name: 'cytoscape',
      component: CytoscapePage,
    },
    {
      path: '/graphml',
      name: 'graphml',
      component: GraphmlPage,
    },
    {
      path: '/playground',
      name: 'playground',
      component: PlayGround,
    },
    {
      path: '/topology',
      name: 'topology',
      component: TopologyPage,
    },
    // {
    //   path: '/cytoscape',
    //   name: 'cytoscape',
      // route level code-splitting
      // this generates a separate chunk (Cytoscape.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/CytoscapeView.vue'),
    // },
  ],
})

export default router
