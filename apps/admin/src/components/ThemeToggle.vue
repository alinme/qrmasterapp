<script setup lang="ts">
import { useThemeStore, type Theme } from '@/stores/theme'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Moon, Sun, Monitor } from 'lucide-vue-next'
import { computed } from 'vue'

const themeStore = useThemeStore()

const themeIcon = computed(() => {
  if (themeStore.theme === 'light') return Sun
  if (themeStore.theme === 'dark') return Moon
  return Monitor
})

const themeLabel = computed(() => {
  if (themeStore.theme === 'light') return 'Light'
  if (themeStore.theme === 'dark') return 'Dark'
  return 'System'
})
</script>

<template>
  <Select :model-value="themeStore.theme" @update:model-value="(value: any) => themeStore.setTheme(value as Theme)">
    <SelectTrigger class="w-[140px]">
      <div class="flex gap-2 items-center">
        <component :is="themeIcon" class="w-4 h-4" />
        <SelectValue>{{ themeLabel }}</SelectValue>
      </div>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="light">
        <div class="flex gap-2 items-center">
          <Sun class="w-4 h-4" />
          <span>Light</span>
        </div>
      </SelectItem>
      <SelectItem value="dark">
        <div class="flex gap-2 items-center">
          <Moon class="w-4 h-4" />
          <span>Dark</span>
        </div>
      </SelectItem>
      <SelectItem value="system">
        <div class="flex gap-2 items-center">
          <Monitor class="w-4 h-4" />
          <span>System</span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
