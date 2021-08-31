<template>
  <div class="px-16 py-4">
    <div class="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
      <div>
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Account</h3>
              <p class="mt-1 text-sm text-gray-600">
                Phasellus lorem quam molestie id quisque diam aenean nulla in.
              </p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
            <form @submit="submitAccountForm">
              <div class="shadow sm:rounded-md">
                <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
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
                  <div class="grid grid-cols-3 gap-6">
                    <div class="col-span-3 sm:col-span-2">
                      <label for="token" class="block text-sm font-medium text-gray-700">
                        Tracker Token
                      </label>
                      <div class="mt-1">
                        <input type="text" name="token" id="token" v-model="token"
                               class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-md sm:text-sm border-gray-300 text-black"
                               placeholder="Enter your token here" aria-describedby="token-description">
                      </div>
                      <p class="mt-2 text-sm text-gray-500" id="token-description">
                        Keep this token save like your password, and never share it.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button type="submit"
                          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { XCircleIcon } from '@heroicons/vue/solid'
const config = require('electron-cfg');

export default {
  name: "Settings",

  components: {
    XCircleIcon
  },

  data() {
    return {
      errors: [],
      token: config.get('tracker-token'),
    }
  },

  methods: {
    submitAccountForm: function (e) {
      this.errors = [];

      if (!this.token) {
        this.errors.push('The token is required.');
      }

      e.preventDefault();

      if (this.token) {
        // Make a request to the API
        this.axios.get('http://base.test/api/user', {
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

          new Notification('Token Saved', {
            body: 'The tracker token has been saved!'
          });

          location.reload();
        })
      }
    }
  },

  mounted: function () {
    //
  },
}
</script>
