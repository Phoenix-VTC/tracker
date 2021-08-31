<template>
  <div class="min-h-screen bg-gray-100">
    <div class="bg-orange-600 pb-32">
      <header class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-white">
            Hey there<span v-if="this.user.username">, {{ this.user.username ?? 'Foo' }}!</span> <span v-else>!</span>
          </h1>
        </div>
      </header>
    </div>

    <main class="-mt-32">
      <div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        <!-- Replace with your content -->
        <div class="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div class="h-96 border-4 border-dashed border-gray-200 rounded-lg"></div>
        </div>
        <!-- /End replace -->
      </div>
    </main>
  </div>
</template>

<script>
const config = require('electron-cfg');

export default {
  name: 'Home',

  data() {
    return {
      errors: [],
      user: config.get('user', {}),
    }
  },

  mounted: function () {
    //
  },
}
</script>
