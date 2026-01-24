import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/r/:slug',
      name: 'restaurant-menu',
      component: () => import('../views/RestaurantView.vue')
    },
    {
      path: '/r/:slug/menu',
      name: 'restaurant-menu-with-table',
      component: () => import('../views/RestaurantView.vue')
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue')
    },
    {
      path: '/order/:orderId',
      name: 'order-status',
      component: () => import('../views/OrderView.vue')
    },
    {
      path: '/scan',
      name: 'scan',
      component: () => import('../views/ScanView.vue')
    },
    {
      path: '/split-bill',
      name: 'split-bill',
      component: () => import('../views/SplitBillView.vue')
    },
    {
      path: '/',
      redirect: '/scan'
    },
    {
      path: '/thank-you',
      name: 'thank-you',
      component: () => import('../views/ThankYouView.vue')
    }
  ]
})

// TODO: Import store outside of component setup if needed, or use axios directly here
import axios from 'axios'

router.beforeEach(async (to, _from, next) => {
  // Check for 't' query param (Table Token)
  const token = to.query.t
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  
  if (token) {
    try {
      // Validate token
      const res = await axios.post(`${API_URL}/public/validate-token`, { token })
      if (res.data.success) {
        // Store session
        const session = {
          token,
          ...res.data.data,
          issuedAt: Date.now()
        }
        localStorage.setItem('table_session', JSON.stringify(session))
        
        // Update cart store with table name
        try {
          const { useCartStore } = await import('../stores/cart')
          const cart = useCartStore()
          cart.tableName = res.data.data.tableName || null
          
          // Check if customer profile exists, if not, show modal
          cart.loadSession()
          if (!cart.customerProfile) {
            // Store the intended route to navigate after profile is saved
            const intendedRoute = res.data.data.restaurantSlug 
              ? { name: 'restaurant-menu', params: { slug: res.data.data.restaurantSlug } }
              : { path: to.path, query: { ...to.query } }
            localStorage.setItem('intended_route', JSON.stringify(intendedRoute))
            // Navigate to profile setup (will be handled by RestaurantView)
            next({ name: 'restaurant-menu', params: { slug: res.data.data.restaurantSlug }, query: { setupProfile: 'true' } })
          } else {
            // Redirect to restaurant menu with slug
            if (res.data.data.restaurantSlug) {
              next({ name: 'restaurant-menu', params: { slug: res.data.data.restaurantSlug } })
            } else {
              // Fallback: remove query param
              const query = { ...to.query }
              delete query.t
              next({ path: to.path, query })
            }
          }
        } catch (e) {
          // Store might not be initialized yet, that's okay
          if (res.data.data.restaurantSlug) {
            next({ name: 'restaurant-menu', params: { slug: res.data.data.restaurantSlug } })
          } else {
            const query = { ...to.query }
            delete query.t
            next({ path: to.path, query })
          }
        }
        return
      }
    } catch (e) {
      console.error('Invalid token', e)
      // Invalid token -> Scan
      return next({ name: 'scan' })
    }
  }

  // Check if we have a stored session
  const storedSession = localStorage.getItem('table_session')
  
  if (to.name === 'scan') {
      if (storedSession) {
          try {
            const session = JSON.parse(storedSession)
            // If we have a valid session with slug, redirect to menu
            if (session.restaurantSlug) {
              next({ name: 'restaurant-menu', params: { slug: session.restaurantSlug } })
              return
            }
          } catch (e) {
            // Invalid session, stay on scan
          }
      }
      next()
      return
  }
  
  // For protected routes (Menu, Cart, Order)
  // If no session, redirect to scan (except thank-you page)
  if (!storedSession && to.name !== 'scan' && to.name !== 'thank-you') {
     next({ name: 'scan' })
  } else {
     // Update cart store with table name from stored session
     if (storedSession) {
       try {
         const session = JSON.parse(storedSession)
         const { useCartStore } = await import('../stores/cart')
         const cart = useCartStore()
         cart.tableName = session.tableName || null
         cart.loadSession()
         
         // Validate token before allowing access to protected routes
         if (cart.tableToken && to.name !== 'scan' && to.name !== 'thank-you') {
           try {
             const validateResponse = await axios.post(`${API_URL}/public/validate-token`, {
               token: cart.tableToken
             })
             if (!validateResponse.data.success) {
               // Token is invalid, clear session and redirect after delay
               cart.clearSession()
               setTimeout(() => {
                 next({ name: 'scan' })
               }, 1500)
               return
             }
           } catch (validateError) {
             // Token validation failed, clear session and redirect after delay
             console.error('Token validation error:', validateError)
             cart.clearSession()
             setTimeout(() => {
               next({ name: 'scan' })
             }, 1500)
             return
           }
         }
         
         // Check if customer profile exists for restaurant menu (required)
         if (to.name === 'restaurant-menu' && !cart.customerProfile && to.query.setupProfile !== 'true') {
           next({ name: 'restaurant-menu', params: to.params, query: { ...to.query, setupProfile: 'true' } })
           return
         }
       } catch (e) {
         // Ignore errors, but redirect to scan if session is corrupted
         if (to.name !== 'scan' && to.name !== 'thank-you') {
           setTimeout(() => {
             next({ name: 'scan' })
           }, 1500)
           return
         }
       }
     }
     next()
  }
})

export default router
