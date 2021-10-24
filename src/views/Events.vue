<template>
  <div class="min-h-screen">
    <div class="bg-orange-600 pb-32">
      <header class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-white">
            Upcoming Events
          </h1>
        </div>
      </header>
    </div>

    <main class="-mt-32">
      <div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        <div class="relative block w-full bg-white rounded-lg p-12 text-center">
          <calendar-icon class="mx-auto h-12 w-12 text-gray-400"/>
          <span class="mt-2 block font-medium text-gray-900">
            Page to be developed
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import {CalendarIcon} from '@heroicons/vue/outline'

export default {
  name: "Events",

  components: {
    CalendarIcon
  },
}
</script>
