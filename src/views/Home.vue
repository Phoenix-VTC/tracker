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
            <!--            <div-->
            <!--                class="border-t border-gray-200 grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-3 sm:divide-y-0 sm:divide-x bg-white rounded-b-lg">-->
            <!--              <button type="button" class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100">-->
            <!--                <span class="text-orange-600">Launch Euro Truck Simulator 2</span>-->
            <!--              </button>-->
            <!--              <button type="button" class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100">-->
            <!--                <span class="text-orange-600">Launch TruckersMP</span>-->
            <!--              </button>-->

            <!--              <button type="button" class="px-6 py-5 text-sm font-medium text-center hover:bg-gray-100">-->
            <!--                <span class="text-orange-600">Launch American Truck Simulator</span>-->
            <!--              </button>-->
            <!--            </div>-->
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import truckSimTelemetry from "trucksim-telemetry"

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
    }
  },

  mounted: function () {
    this.telemetry.watch({interval: 10000}, this.update)
  },

  unmounted: function () {
    this.telemetry.stop()
  },
}
</script>
