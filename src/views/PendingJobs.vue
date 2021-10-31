<template>
  <div class="min-h-screen">
    <div class="bg-orange-600 pb-32">
      <header class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-white">
            Pending Jobs
          </h1>
        </div>
      </header>
    </div>

    <main class="-mt-32">
      <div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col" id="table" v-if="jobs.length > 0">
          <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div class="shadow overflow-hidden sm:rounded-lg">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-white uppercase">
                  <tr>
                    <th scope="col"
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider">
                      Game
                    </th>
                    <th scope="col"
                        class="px-6 py-3 text-left text-xs font-medium  tracking-wider">
                      From
                    </th>
                    <th scope="col"
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider">
                      To
                    </th>
                    <th scope="col"
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider">
                      Distance
                    </th>
                    <th scope="col" class="relative px-6 py-3">
                      <span class="sr-only">Verify</span>
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr :class="{'bg-white dark:bg-gray-800': index % 2 === 0, 'bg-gray-50 dark:bg-gray-900': index % 2 !== 0 }"
                      class="text-gray-500 dark:text-gray-400"
                      v-for="(job, index) in jobs"
                      :key="job.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span v-if="job.game_id === 1">
                        ETS2
                      </span>
                      <span v-else>
                        ATS
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      {{ job.pickup_city.real_name }}
                      ({{ job.pickup_company.name }})
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      {{ job.destination_city.real_name }}
                      ({{ job.destination_company.name }})
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span v-if="job.game_id === 2">
                        {{ Math.round(job.distance / 1.609) }} mi
                      </span>
                      <span v-else>
                        {{ job.distance }} km
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a :href="`${phoenixBaseUrl}/jobs/${job.id}/verify`" target="_blank"
                         class="text-orange-500 hover:text-orange-600" v-if="job.status === 0">Verify</a>

                      <span
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-400 text-yellow-800 dark:text-yellow-900"
                          v-if="job.status === 1">
                        Pending Verification
                      </span>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="relative block w-full bg-white dark:bg-gray-900 rounded-lg p-12 text-center" id="loading-data-state"
             v-if="!jobsLoaded">
          <refresh-icon class="mx-auto h-12 w-12 text-gray-400"/>
          <span class="mt-2 block font-medium text-gray-900 dark:text-white">
            Loading data...
          </span>
        </div>

        <div class="relative block w-full bg-white dark:bg-gray-900 rounded-lg p-12 text-center" id="empty-state"
             v-else-if="jobs.length === 0 && jobsLoaded">
          <!-- Iconoir box-iso -->
          <svg class="mx-auto h-12 w-12 text-gray-400" width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24"
               fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <path
                d="M2.6954 7.18536L11.6954 11.1854L12.3046 9.81464L3.3046 5.81464L2.6954 7.18536ZM12.75 21.5V10.5H11.25V21.5H12.75ZM12.3046 11.1854L21.3046 7.18536L20.6954 5.81464L11.6954 9.81464L12.3046 11.1854Z"
                fill="currentColor"/>
            <path
                d="M3 17.1101V6.88992C3 6.65281 3.13964 6.43794 3.35632 6.34164L11.7563 2.6083C11.9115 2.53935 12.0885 2.53935 12.2437 2.6083L20.6437 6.34164C20.8604 6.43794 21 6.65281 21 6.88992V17.1101C21 17.3472 20.8604 17.5621 20.6437 17.6584L12.2437 21.3917C12.0885 21.4606 11.9115 21.4606 11.7563 21.3917L3.35632 17.6584C3.13964 17.5621 3 17.3472 3 17.1101Z"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.5 4.5L16.1437 8.34164C16.3604 8.43794 16.5 8.65281 16.5 8.88992V12.5" stroke="currentColor"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="mt-2 block font-medium text-gray-900 dark:text-white">
            You don't have any pending jobs
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import {RefreshIcon} from '@heroicons/vue/outline'
import config from "electron-cfg";

export default {
  name: "PendingJobs",

  components: {
    RefreshIcon
  },

  data() {
    return {
      token: null,
      jobsLoaded: false,
      jobs: [],
      phoenixBaseUrl: this.$phoenixBaseUrl,
      interval: null,
    }
  },

  methods: {
    loadData: function () {
      this.token = config.get('tracker-token')

      this.axios.get(`${this.$apiEndpointUrl}/tracker/jobs`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }).catch(function (error) {
        // Clear user data & reload page if unauthorized
        if (error.response.status === 401) {
          config.delete('tracker-token')
          config.delete('user')

          location.reload();
        } else {
          // Else return a generic error notification
          new Notification('Something went wrong while trying to load your pending jobs.', {
            body: `Error code: ${error.response.status}`
          })
        }
      }).then((response) => {
        this.jobsLoaded = true;
        this.jobs = response.data;
      });
    }
  },

  mounted: function () {
    this.loadData();

    this.interval = setInterval(function () {
      this.loadData();
    }.bind(this), 15000);
  },

  beforeUnmount: function () {
    clearInterval(this.interval);
  }
}
</script>

<style scoped>

</style>
