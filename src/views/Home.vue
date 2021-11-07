<template>
  <div class="min-h-screen">
    <div class="bg-orange-600 pb-32">
      <header class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-white">
            Hey there<span v-if="this.user.username">, {{ this.user.username }}!</span> <span v-else>!</span>
          </h1>
        </div>
      </header>
    </div>

    <main class="-mt-32">
      <div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 space-y-6">
        <section>
          <div class="overflow-hidden shadow">
            <h2 class="sr-only" id="profile-overview-title">Profile Overview</h2>
            <div class="p-6 rounded-t-lg"
                 style="background-image: url('https://tracker-resources.s3.fr-par.scw.cloud/header.png'); background-repeat: no-repeat; background-size: cover;">
              <div class="sm:flex sm:items-center sm:justify-between">
                <div class="sm:flex sm:space-x-5">
                  <div class="flex-shrink-0">
                    <div v-if="!game?.game">
                      <div class="mx-auto h-24 w-24 bg-cover bg-center bg-no-repeat rounded-full"
                           style="background-image: url('https://tracker-resources.s3.fr-par.scw.cloud/waiting_for_game_icon.png')"></div>
                    </div>
                    <div v-else>
                      <div class="mx-auto h-24 w-24 bg-cover bg-center bg-no-repeat rounded-full"
                           v-if="game.game.id === 1"
                           style="background-image: url('https://tracker-resources.s3.fr-par.scw.cloud/ets2_icon.png')"></div>

                      <div class="mx-auto h-24 w-24 bg-cover bg-center bg-no-repeat rounded-full"
                           v-if="game.game.id === 2"
                           style="background-image: url('https://tracker-resources.s3.fr-par.scw.cloud/ats_icon.png')"></div>
                    </div>
                  </div>
                  <div class="mt-4 text-left sm:mt-0 sm:pt-1 sm:text-left items-center">
                    <div class="mt-5 text-xl font-bold text-gray-900 sm:text-2xl">
                      <span v-if="!game?.sdkActive">Waiting for game</span>

                      <span v-else>Playing {{ convertGameIdToFullName(game.game.id) }}</span>
                    </div>
                    <div class="font-medium text-gray-800">
                      <span v-if="!game?.sdkActive">Ready to play</span>

                      <div v-else>
                        <span v-if="job.source.city.name && job.destination.city.name">
                          Carrying <span class="font-bold">{{ job.cargo.name }}</span> from <span class="font-bold">{{
                            job.source.city.name
                          }}</span> to <span class="font-bold">{{ job.destination.city.name }}</span>
                        </span>
                        <span v-else>Freeroaming</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
                class="border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-800 sm:grid-cols-3 sm:divide-y-0 sm:divide-x bg-white dark:bg-gray-900 rounded-b-lg">
              <button type="button"
                      class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-bl-lg"
                      v-on:click="launchEts2">
                <span class="text-orange-600">Launch Euro Truck Simulator 2</span>
              </button>
              <button type="button"
                      class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      v-on:click="launchTruckersmp">
                <span class="text-orange-600">Launch TruckersMP</span>
              </button>

              <button type="button"
                      class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-br-lg"
                      v-on:click="launchAts">
                <span class="text-orange-600">Launch American Truck Simulator</span>
              </button>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">

            <div class="flex flex-col-reverse lg:flex-row w-full bg-white dark:bg-gray-900 shadow rounded"
                 v-if="showNextEvent">
              <div class="w-full lg:w-1/2">
                <div aria-label="card" class="pt-4 pb-4 pl-6 pr-4">
                  <div class="flex justify-between items-center lg:items-start flex-row-reverse lg:flex-col">
                    <h4 class="text-gray-600 dark:text-gray-400 text-base font-normal">Next event</h4>
                  </div>
                  <a class="text-gray-800 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300"
                     :href="nextEvent.url" target="_blank">
                    <h2 class="mb-2 tracking-normal text-xl lg:text-2xl font-bold capitalize">
                      {{ nextEvent.name }}
                    </h2>
                  </a>
                  <p class="mb-6 font-normal text-gray-600 dark:text-gray-400 text-sm tracking-normal w-full" v-html="nextEvent.description"></p>
                  <div class="flex lg:items-center items-start flex-col lg:flex-row">
                    <div
                        class="text-gray-600 dark:text-gray-400 focus:outline-none focus:text-indigo-700 flex items-end">
                            <span class="mr-1">
                                <CalendarIcon class="h-5"/>
                          </span>
                      <span class="text-sm tracking-normal font-normal text-center">
                        {{ moment(nextEvent.start_date).format('LLL') }}
                      </span>
                    </div>
                    <div
                        class="text-gray-600 dark:text-gray-400 focus:outline-none focus:text-indigo-700 mt-4 lg:mt-0 ml-0 lg:ml-12 flex items-end">
                      <span class="mr-1">
                        <LocationMarkerIcon class="h-5"/>
                      </span>
                      <div class="text-sm tracking-normal font-normal text-center">
                        <span v-if="nextEvent.game_id === 1">ETS2</span>
                        <span v-else-if="nextEvent.game_id === 2">ATS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                  class="relative w-full h-64 lg:h-auto lg:w-1/2 rounded-t lg:rounded-t-none lg:rounded-r inline-block">
                <img class="w-full h-full absolute inset-0 object-cover rounded-t lg:rounded-r lg:rounded-t-none"
                     :src="nextEvent.featured_image_url" :alt="nextEvent.name"/>
              </div>
            </div>

          </div>

          <div>
            <section aria-labelledby="online-users-title" v-if="onlineUsers.length">
              <div class="rounded-lg bg-white dark:bg-gray-900 overflow-hidden shadow">
                <div class="p-6">
                  <h2 class="text-lg font-medium text-gray-900 dark:text-white" id="online-users-title">Online
                    Users</h2>
                  <div class="flow-root mt-6">
                    <ul role="list" class="-my-5 divide-y divide-gray-200" v-for="user in onlineUsers"
                        v-bind:key="user">
                      <li class="py-4">
                        <div class="flex items-center space-x-4">
                          <div class="flex-shrink-0">
                            <img class="h-8 w-8 rounded-full" :src="user.profile_picture"
                                 :alt="user.username + '\'s profile picture'">
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {{ user.username }}
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400 truncate" v-if="user.near">
                              Near {{ user.near }}
                            </p>
                          </div>
                          <div>
                            <a :href="`${phoenixBaseUrl}/users/${user.id}`" target="_blank"
                               class="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 dark:border-gray-600 text-sm leading-5 font-medium rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700">
                              View Profile
                            </a>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import truckSimTelemetry from 'trucksim-telemetry';
import {ipcRenderer} from 'electron';
import {CalendarIcon, LocationMarkerIcon} from '@heroicons/vue/outline';
import moment from 'moment';

const config = require('electron-cfg');

export default {
  name: 'Home',

  components: {
    CalendarIcon,
    LocationMarkerIcon,
  },

  data() {
    return {
      errors: [],
      user: config.get('user', {}),
      game: {},
      controls: {},
      navigation: {},
      job: {},
      truck: {},
      trailer: {},
      log: [],
      phoenixBaseUrl: this.$phoenixBaseUrl,
      onlineUsers: [],
      interval: null,
      showNextEvent: false,
      nextEvent: {},
    }
  },

  created: function () {
    this.moment = moment;
  },

  computed: {
    telemetry: function () {
      return truckSimTelemetry()
    }
  },

  methods: {
    update: function (data) {
      for (const key of Object.keys(data)) {
        this[key] = data[key]
      }
    },

    convertGameIdToFullName(id) {
      if (id === 1) {
        return 'Euro Truck Simulator 2';
      } else if (id === 2) {
        return 'American Truck Simulator'
      }
    },

    launchEts2() {
      ipcRenderer.sendSync('launch-ets2');
    },

    launchTruckersmp() {
      ipcRenderer.sendSync('launch-truckersmp');
    },

    launchAts() {
      ipcRenderer.sendSync('launch-ats');
    },

    loadOnlineUsers: function () {
      const token = config.get('tracker-token')

      this.axios.get(`${this.$apiEndpointUrl}/tracker/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(response => (this.onlineUsers = response.data))
    },

    loadNextEvent: function () {
      const token = config.get('tracker-token')

      this.axios.get(`${this.$apiEndpointUrl}/tracker/events/next`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(response => {
        if (response.status === 200) {
          this.nextEvent = response.data;
          this.showNextEvent = true;
        }
      })
    }
  },

  mounted: function () {
    this.telemetry.watch({interval: 10000}, this.update);

    this.loadOnlineUsers();
    this.loadNextEvent();

    this.interval = setInterval(function () {
      this.loadOnlineUsers();
    }.bind(this), 15000);
  },

  beforeUnmount: function () {
    clearInterval(this.interval);
  },

  unmounted: function () {
    this.telemetry.stop()
  },
}
</script>
