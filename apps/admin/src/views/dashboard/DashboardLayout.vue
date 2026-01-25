<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const path = route.path
  if (path === '/') return [{ label: 'Overview' }]
  if (path === '/menu') return [{ label: 'Menu' }]
  if (path === '/orders') return [{ label: 'Orders' }]
  if (path === '/tables') return [{ label: 'Tables' }]
  return []
})
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
