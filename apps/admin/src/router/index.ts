import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/kitchen',
      name: 'kitchen',
      component: () => import('../views/dashboard/KitchenView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/superadmin',
      component: () => import('../views/superadmin/SuperAdminLayout.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true },
      children: [
        {
          path: '',
          name: 'superadmin-dashboard',
          component: () => import('../views/superadmin/SuperAdminDashboard.vue')
        },
        {
          path: 'restaurants',
          name: 'superadmin-restaurants',
          component: () => import('../views/superadmin/RestaurantsView.vue')
        },
        {
          path: 'restaurants/:id',
          name: 'superadmin-restaurant-detail',
          component: () => import('../views/superadmin/RestaurantDetailView.vue')
        },
        {
          path: 'users',
          name: 'superadmin-users',
          component: () => import('../views/superadmin/UsersView.vue')
        }
      ]
    },
    {
      path: '/',
      component: () => import('../views/dashboard/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/dashboard/OverviewView.vue')
        },
        {
          path: 'menu',
          name: 'menu',
          component: () => import('../views/dashboard/MenuView.vue')
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('../views/dashboard/OrdersView.vue')
        },
        {
          path: 'tables',
          name: 'tables',
          component: () => import('../views/dashboard/TablesView.vue')
        },
        {
          path: 'server',
          name: 'server',
          component: () => import('../views/dashboard/ServerView.vue')
        },
        {
          path: 'staff',
          name: 'staff',
          component: () => import('../views/dashboard/StaffView.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // If route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }
  
  // Check for Super Admin routes
  if (to.meta.requiresSuperAdmin) {
    if (authStore.user?.role !== 'SUPER_ADMIN') {
      next({ name: 'dashboard' })
      return
    }
  }
  
  // If user is already logged in and tries to go to login
  if (to.name === 'login' && authStore.isAuthenticated) {
    // Redirect Super Admin to superadmin dashboard
    if (authStore.user?.role === 'SUPER_ADMIN') {
      next({ name: 'superadmin-dashboard' })
    } else {
      next({ name: 'dashboard' })
    }
    return
  }
  
  // Redirect Super Admin from regular dashboard to superadmin
  if (to.name === 'dashboard' && authStore.user?.role === 'SUPER_ADMIN' && !to.path.startsWith('/superadmin')) {
    next({ name: 'superadmin-dashboard' })
    return
  }
  
  next()
})

export default router
