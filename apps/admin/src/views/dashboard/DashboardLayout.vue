<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const route = useRoute()
const authStore = useAuthStore()

const breadcrumbs = computed(() => {
  const path = route.path
  if (path === '/') return [{ label: 'Overview' }]
  if (path === '/menu') return [{ label: 'Menu' }]
  if (path === '/orders') return [{ label: 'Orders' }]
  if (path === '/tables') return [{ label: 'Tables' }]
  return []
})

async function stopImpersonation() {
  try {
    await authStore.stopImpersonation()
    toast.success('Stopped impersonation')
  } catch (error: any) {
    toast.error('Failed to stop impersonation')
  }
}
</script>

<template>
  <div class="flex min-h-screen w-full bg-background">
    <!-- Desktop Sidebar -->
    <AppSidebar class="hidden md:flex" />

    <!-- Mobile Sidebar -->
    <Sheet>
      <SheetTrigger as-child class="md:hidden">
        <Button variant="ghost" size="icon" class="fixed top-4 left-4 z-50">
          <Menu class="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" class="w-64 p-0">
        <AppSidebar />
      </SheetContent>
    </Sheet>

    <!-- Main Content -->
    <div class="flex flex-1 flex-col">
      <!-- Impersonation Banner -->
      <div 
        v-if="authStore.isImpersonating" 
        class="flex items-center justify-between gap-4 px-4 py-3 bg-amber-500 text-white"
      >
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-medium">Impersonating: {{ authStore.user?.email }}</span>
          <span v-if="authStore.originalUser" class="text-xs opacity-90">(Original: {{ authStore.originalUser.email }})</span>
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          @click="stopImpersonation"
          class="bg-white text-amber-700 hover:bg-gray-100"
        >
          <X class="mr-1 w-4 h-4" />
          Stop Impersonation
        </Button>
      </div>

      <!-- Header -->
      <header class="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6">
        <div class="flex items-center gap-2">
          <Breadcrumb class="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="breadcrumbs.length > 0" />
              <BreadcrumbItem v-for="(crumb, index) in breadcrumbs" :key="index">
                <BreadcrumbPage>{{ crumb.label }}</BreadcrumbPage>
                <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div class="md:hidden">
            <span class="text-lg font-semibold">{{ breadcrumbs[0]?.label || 'Dashboard' }}</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <!-- Page Content -->
      <main class="flex flex-1 flex-col gap-4 p-4 md:p-6 pt-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
