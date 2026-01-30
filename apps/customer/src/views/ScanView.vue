<script setup lang="ts">
import { QrCode, Camera, Smartphone } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 text-center">
    <div class="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20">
      <QrCode class="h-16 w-16 text-blue-400" />
    </div>
    
    <h1 class="text-4xl font-bold mb-4">Bun venit!</h1>
    <p class="text-gray-300 max-w-md mx-auto mb-8 text-lg">
      Scanează codul QR de pe masă pentru a vedea meniul și plasa o comandă.
    </p>
    
    <div class="max-w-md w-full space-y-4">
      <div class="p-6 border border-gray-700 rounded-xl bg-gray-800/50 backdrop-blur-sm">
        <div class="flex items-start gap-4 mb-4">
          <div class="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Camera class="w-6 h-6 text-blue-400" />
          </div>
          <div class="text-left">
            <h3 class="font-semibold mb-2">Cum să scanezi</h3>
            <ol class="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Deschide aplicația cameră a telefonului</li>
              <li>Îndreaptă camera către codul QR de pe masă</li>
              <li>Apasă pe notificarea care apare</li>
              <li>Sau folosește o aplicație de scanare QR</li>
            </ol>
          </div>
        </div>
      </div>

      <div class="p-6 border border-gray-700 rounded-xl bg-gray-800/50 backdrop-blur-sm">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Smartphone class="w-6 h-6 text-green-400" />
          </div>
          <div class="text-left">
            <h3 class="font-semibold mb-2">Ai mai scanat înainte?</h3>
            <p class="text-sm text-gray-300">
              Daca ai mai scanat, poți deschide aplicația direct din ecranul principal.
              Sesiunea la masă va fi restaurată automat.
            </p>
          </div>
        </div>
      </div>

      <div class="pt-4">
        <p class="text-xs text-gray-500">
          Nu găsești codul QR? Cere ajutor chelnerului.
        </p>
      </div>
    </div>
  </div>
</template>
