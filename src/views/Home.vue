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
      <div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 space-y-6">
        <section
            style="background-image: url('https://tracker-resources.s3.fr-par.scw.cloud/header.png'); background-repeat: no-repeat; background-size: cover;"
            class="rounded-lg">
          <div class="overflow-hidden shadow">
            <h2 class="sr-only" id="profile-overview-title">Profile Overview</h2>
            <div class="p-6">
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
                    <div class="font-medium text-gray-600">
                      <span v-if="!game?.sdkActive">Ready to play</span>

                      <div class="font-normal" v-else>
                        <span v-if="job.source.city.name && job.destination.city.name">
                          Carrying <span class="font-medium">{{ job.cargo.name }}</span> from <span class="font-medium">{{
                            job.source.city.name
                          }}</span> to <span class="font-medium">{{ job.destination.city.name }}</span>
                        </span>
                        <span v-else>Freeroaming</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
                class="border-t border-gray-200 grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-3 sm:divide-y-0 sm:divide-x bg-white rounded-b-lg">
              <button type="button" class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100"
                      v-on:click="launchEts2">
                <span class="text-orange-600">Launch Euro Truck Simulator 2</span>
              </button>
              <button type="button" class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100"
                      v-on:click="launchTruckersmp">
                <span class="text-orange-600">Launch TruckersMP</span>
              </button>

              <button type="button" class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100"
                      v-on:click="launchAts">
                <span class="text-orange-600">Launch American Truck Simulator</span>
              </button>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2"></div>

          <div>
            <section aria-labelledby="online-users-title" v-if="onlineUsers.length">
              <div class="rounded-lg bg-white overflow-hidden shadow">
                <div class="p-6">
                  <h2 class="text-lg font-medium text-gray-900" id="online-users-title">Online Users</h2>
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
                            <p class="text-sm font-medium text-gray-900 truncate">
                              {{ user.username }}
                            </p>
                            <p class="text-sm text-gray-500 truncate" v-if="user.near">
                              Near {{ user.near }}
                            </p>
                          </div>
                          <div>
                            <a :href="`${phoenixBaseUrl}/users/${user.id}`" target="_blank"
                               class="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
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
import truckSimTelemetry from "trucksim-telemetry"
import {ipcRenderer} from 'electron'

const config = require('electron-cfg');

export default {
  name: 'Home',

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
    }
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
    }
  },

  mounted: function () {
    this.telemetry.watch({interval: 10000}, this.update);

    this.loadOnlineUsers();

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
