<template>
  <div class="flex flex-row h-full">
    <!-- Sidebar -->
    <nav class="bg-gray-900 w-20  justify-between flex flex-col ">
      <div class="mt-10 mb-10">
        <a href="#">
          <img :src="this.user.profile_picture ?? 'https://i.imgur.com/qw6JoIu.png'"
               class="rounded-full w-10 h-10 mb-3 mx-auto" :alt="this.user.username"/>
        </a>
        <div class="mt-10">
          <ul class="space-y-8">
            <li>
              <router-link to="/">
                <HomeIcon class="h-6 w-6 text-gray-300 mx-auto hover:text-orange-500"/>
              </router-link>
            </li>

            <li>
              <router-link to="/pending-jobs">
                <TruckIcon class="h-6 w-6 text-gray-300 mx-auto hover:text-orange-500"/>
              </router-link>
            </li>

            <li>
              <router-link to="/">
                <CalendarIcon class="h-6 w-6 text-gray-300 mx-auto hover:text-orange-500"/>
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

      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4" v-if="Object.keys(this.user).length === 0">
        <div class="flex">
          <div class="flex-shrink-0">
            <ExclamationIcon class="h-5 w-5 text-yellow-400"/>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              You currently aren't logged in.
              <router-link to="/settings" class="font-medium underline text-yellow-700 hover:text-yellow-600">
                Connect your tracker token.
              </router-link>
            </p>
          </div>
        </div>
      </div>

      <router-view/>

    </div>
  </div>
</template>

<script>
import {HomeIcon, TruckIcon, CalendarIcon, CogIcon} from '@heroicons/vue/outline'
import {ExclamationIcon} from '@heroicons/vue/solid'

const config = require('electron-cfg');

export default {
  components: {
    HomeIcon,
    TruckIcon,
    CalendarIcon,
    CogIcon,
    ExclamationIcon
  },

  data() {
    return {
      errors: [],
      user: config.get('user', {}),
    }
  },
}
</script>
