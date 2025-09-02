import { createRouter, createWebHistory } from 'vue-router'
// import CytoscapeView from '../views/CytoscapeView.vue'
import CytoscapePage from '../views/cytoscape/CytoscapePage.vue'
import Graphml from '../views/Graphml.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: CytoscapePage,
    },
    {
      path: '/graphml',
      name: 'graphml',
      component: Graphml,
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
