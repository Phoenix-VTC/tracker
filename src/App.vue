<template>
  <div class="flex flex-row h-full bg-white dark:bg-gray-800">
    <!-- Sidebar -->
    <nav class="bg-gray-900 w-20 justify-between flex flex-col">
      <div class="mt-10 mb-10">
        <a href="#">
          <img
              :src="this.user.profile_picture ?? 'https://tracker-resources.s3.fr-par.scw.cloud/default_profile_picture.png'"
              class="rounded-full w-10 h-10 mb-3 mx-auto" :alt="this.user.username"/>
        </a>
        <div class="mt-10">
          <ul class="space-y-8">
            <li>
              <router-link to="/" class="text-gray-300 hover:text-gray-100"
                           active-class="text-orange-500 hover:text-orange-500">
                <HomeIcon class="h-6 w-6 mx-auto"/>
              </router-link>
            </li>

            <li>
              <router-link to="/pending-jobs" class="text-gray-300 hover:text-gray-100"
                           active-class="text-orange-500 hover:text-orange-500">
                <TruckIcon class="h-6 w-6 mx-auto"/>
              </router-link>
            </li>

<!--            <li>-->
<!--              <router-link to="/events" class="text-gray-300 hover:text-gray-100"-->
<!--                           active-class="text-orange-500 hover:text-orange-500">-->
<!--                <CalendarIcon class="h-6 w-6 mx-auto"/>-->
<!--              </router-link>-->
<!--            </li>-->
          </ul>
        </div>
      </div>
      <div class="mb-4">
        <router-link to="/settings" class="text-gray-300 hover:text-gray-100"
                     active-class="text-orange-500 hover:text-orange-500">
          <CogIcon class="h-5 w-5 mx-auto"/>
        </router-link>
      </div>
    </nav>
    <div class="text-gray-700 bg-gray-100 dark:bg-gray-800 h-screen w-screen">

      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4" v-if="Object.keys(this.user).length === 0">
        <div class="flex">
          <div class="flex-shrink-0">
            <ExclamationIcon class="h-5 w-5 text-yellow-400"/>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <b>You currently aren't logged in.</b>
              Please connect your tracker token.
            </p>
          </div>
        </div>
      </div>

      <router-view/>

    </div>
  </div>
</template>

<script>
import {HomeIcon, TruckIcon, CogIcon} from '@heroicons/vue/outline'
import {ExclamationIcon} from '@heroicons/vue/solid'

const config = require('electron-cfg');

export default {
  components: {
    HomeIcon,
    TruckIcon,
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
