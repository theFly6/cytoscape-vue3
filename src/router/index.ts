import { createRouter, createWebHistory } from 'vue-router'
import IndexPage from '../views/index/IndexPage.vue'

/** Feat-8：遗留实验页已下线，统一重定向到主入口 IndexPage */
const LEGACY_REDIRECTS = ['/topology', '/cytoscape', '/graphml', '/playground'] as const

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'index',
            component: IndexPage,
        },
        ...LEGACY_REDIRECTS.map((path) => ({
            path,
            redirect: '/',
        })),
        {
            path: '/:pathMatch(.*)*',
            redirect: '/',
        },
    ],
})

export default router
