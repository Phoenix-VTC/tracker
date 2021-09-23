<template>
  <div class="min-h-screen bg-gray-100">
    <div class="bg-orange-600 pb-32">
      <header class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-white">
            Settings
          </h1>
        </div>
      </header>
    </div>

    <main class="-mt-32">
      <div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        <div>
          <!-- Form error message -->
          <div class="rounded-md bg-red-50 p-4" v-if="errors.length">
            <div class="flex">
              <div class="flex-shrink-0">
                <XCircleIcon class="h-5 w-5 text-red-400"/>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Please check the following errors and then try again:
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <ul class="list-disc pl-5 space-y-1">
                    <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <!-- End of form error message -->
          <form class="space-y-6" @submit="submitForm">
            <settings-section title="Account" description="Update your account settings, including tracker token here.">
              <div class="grid grid-cols-3 gap-6">
                <div class="col-span-3 sm:col-span-2">
                  <label for="token" class="block text-sm font-medium text-gray-700">Tracker token</label>
                  <div class="mt-1 flex rounded-md shadow-sm">
                    <div class="relative flex items-stretch flex-grow focus-within:z-10">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <key-icon class="h-5 w-5 text-gray-400"/>
                      </div>
                      <input :type="tokenInputType" name="token" id="token" v-model="token"
                             class="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300"
                             placeholder="Enter your token here" aria-describedby="token-description">
                    </div>
                    <button type="button" @click="toggleTokenDisplay"
                            class="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                      <eye-icon v-if="tokenInputType === 'password'" class="h-5 w-5 text-gray-400"/>
                      <eye-off-icon v-else class="h-5 w-5 text-gray-400"/>
                      <span v-if="tokenInputType === 'password'">Show</span>
                      <span v-else>Hide</span>
                    </button>
                  </div>
                  <p class="mt-2 text-sm text-gray-500" id="token-description">
                    Keep this token save like your password, and never share it.
                  </p>
                </div>
              </div>
            </settings-section>

            <settings-section title="Developer Settings" description="Don't touch this unless you know what you're doing.">
              <fieldset>
                <div>
                  <legend class="text-base font-medium text-gray-900">API Endpoint</legend>
                  <p class="text-sm text-gray-500">Where the tracker data will be requested from/sent to.</p>
                </div>
                <div class="mt-4 space-y-4">
                  <div class="flex items-center">
                    <input id="production" name="api-endpoint" type="radio" value="production" v-model="apiEndpoint"
                           class="focus:ring-indigo-500 h-4 w-4 text-orange-600 border-gray-300">
                    <label for="production" class="ml-3 block text-sm font-medium text-gray-700">
                      Production
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input id="staging" name="api-endpoint" type="radio" value="staging" v-model="apiEndpoint"
                           class="focus:ring-indigo-500 h-4 w-4 text-orange-600 border-gray-300">
                    <label for="staging" class="ml-3 block text-sm font-medium text-gray-700">
                      Staging
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input id="local" name="api-endpoint" type="radio" value="local" v-model="apiEndpoint"
                           class="focus:ring-indigo-500 h-4 w-4 text-orange-600 border-gray-300">
                    <label for="local" class="ml-3 block text-sm font-medium text-gray-700">
                      Local
                    </label>
                  </div>
                </div>
              </fieldset>
            </settings-section>

            <div class="flex justify-end">
              <button type="submit"
                      class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import {XCircleIcon, KeyIcon, EyeIcon, EyeOffIcon} from '@heroicons/vue/solid';
import SettingsSection from '../components/SettingsSection';

const config = require('electron-cfg');

export default {
  name: "Settings",

  components: {
    XCircleIcon,
    KeyIcon,
    EyeIcon,
    EyeOffIcon,
    SettingsSection,
  },

  data() {
    return {
      errors: [],
      token: config.get('tracker-token'),
      tokenInputType: 'password',
      apiEndpoint: config.get('api-endpoint', 'production'),
    }
  },

  methods: {
    submitForm: function (e) {
      this.errors = [];

      if (this.token !== config.get('tracker-token')) {
        if (!this.token) {
          this.errors.push('The token is required.');
        }

        e.preventDefault();

        // Make a request to the API
        this.axios.get(`${this.$apiEndpointUrl}/user`, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }).catch(function (error) {
          if (error.response.status === 402) {
            // Return incorrect tracker token notification if the status is 401
            new Notification('Incorrect tracker token!', {
              body: `Please try again. Error code: ${error.response.status}`
            })
          } else {
            // Else return a generic error notification
            new Notification('Something went wrong while trying to authenticate.', {
              body: `Error code: ${error.response.status}`
            })
          }
        }).then((response) => {
          // Return if response is empty
          if (!response) {
            return;
          }

          // Save the token
          config.set('tracker-token', this.token);

          // Save the user data
          config.set('user', response.data);

          location.reload();
        })
      }

      if (this.apiEndpoint !== config.get('api-endpoint')) {
        config.set('api-endpoint', this.apiEndpoint);
      }

      new Notification('Settings saved', {
        body: 'Your settings have been saved!'
      });
    },

    toggleTokenDisplay() {
      if (this.tokenInputType === 'password') {
        this.tokenInputType = 'text';
      } else {
        this.tokenInputType = 'password';
      }
    }
  },

  mounted: function () {
    //
  },
}
</script>
