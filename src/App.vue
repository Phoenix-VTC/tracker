<template>
  <div class="flex flex-row h-full">
    <!-- Sidebar -->
    <nav class="bg-gray-900 w-20  justify-between flex flex-col ">
      <div class="mt-10 mb-10">
        <a href="#">
          <img :src="this.user.profile_picture ?? 'https://i.imgur.com/qw6JoIu.png'"
               class="rounded-full w-10 h-10 mb-3 mx-auto" alt="Diego"/>
        </a>
        <div class="mt-10">
          <ul>
            <li class="mb-6">
              <router-link to="/">
                <HomeIcon class="h-6 w-6 text-gray-300 mx-auto hover:text-orange-500"/>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
      <div class="mb-4">
        <router-link to="/settings">
          <CogIcon class="h-5 w-5 text-gray-300 mx-auto hover:text-orange-500"/>
        </router-link>
      </div>
    </nav>
    <div class="text-gray-700 bg-gray-200 h-screen w-screen">
      <router-view/>
    </div>
  </div>
</template>

<script>
import { HomeIcon, CogIcon } from '@heroicons/vue/outline'
const config = require('electron-cfg');

export default {
  components: {
    HomeIcon,
    CogIcon
  },

  data() {
    return {
      errors: [],
      user: config.get('user', {}),
    }
  },
}
</script>
