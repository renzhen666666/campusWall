import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './style.css'

import * as IconPark from '@icon-park/vue-next/es/all'
import '@icon-park/vue-next/styles/index.css'


// 导入页面组件
import Home from './views/Home.vue'
import Wall from './views/Wall.vue'
import MessageDetail from './views/MessageDetail.vue'
import Help from './views/Help.vue'
import Apps from './views/Apps.vue'
import AdminLogin from './views/AdminLogin.vue'
import Admin from './views/Admin.vue'
import Partition from './views/Partition.vue'
import UserProfile from './views/UserProfile.vue'


// 路由配置
const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/wall', name: 'Wall', component: Wall },
  { path: '/wall/message/:id', name: 'MessageDetail', component: MessageDetail, props: true },
  { path: '/p/:tag?', name: 'Partition', component: Partition, props: true },
  { path: '/user/:id', name: 'UserProfile', component: UserProfile, props: true },

  { path: '/help', name: 'Help', component: Help },
  { path: '/help/form', name: 'HelpForm', component: () => import('./views/HelpForm.vue') },
  { path: '/help/report/:id', name: 'Report', component: () => import('./views/Report.vue'), props: true },
  { path: '/help/success', name: 'HelpSuccess', component: () => import('./views/HelpSuccess.vue') },
  { path: '/apps', name: 'Apps', component: Apps },

  { path: '/admin', name: 'Admin', component: Admin, meta: { requiresAuth: true } },
  { path: '/admin/login', name: 'AdminLogin', component: AdminLogin },
  { path: '/admin/wall', name: 'AdminWall', component: () => import('./views/AdminWall.vue'), meta: { requiresAuth: true } },
  { path: '/admin/notice', name: 'AdminNotice', component: () => import('./views/AdminNotice.vue'), meta: { requiresAuth: true } },
  { path: '/admin/report', name: 'AdminReport', component: () => import('./views/AdminReport.vue'), meta: { requiresAuth: true } },
  { path: '/admin/log', name: 'AdminLog', component: () => import('./views/AdminLog.vue'), meta: { requiresAuth: true } },
  { path: '/admin/error_log', name: 'AdminErrorLog', component: () => import('./views/AdminErrorLog.vue'), meta: { requiresAuth: true } },

  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('./views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 总是滚动到页面顶部
    return { top: 0 }
  }
})

// 导航守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const adminUser = localStorage.getItem('admin_user')
    const adminPassword = localStorage.getItem('admin_password')
    if (!adminUser || !adminPassword) {
      next('/admin/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)


app.mount('#app')