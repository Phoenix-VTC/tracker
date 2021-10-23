import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import './assets/index.css'
import axios from 'axios'
import VueAxios from 'vue-axios'
import {ipcRenderer} from 'electron'
import config from 'electron-cfg';
import log from 'electron-log';
const AxiosLog = log.scope('vue-axios');

const app = createApp(App)

app.config.globalProperties.$apiEndpointUrl = ipcRenderer.sendSync('get-api-endpoint-url')

app.config.globalProperties.$phoenixBaseUrl = ipcRenderer.sendSync('get-phoenixbase-url')

axios.interceptors.response.use((response) => response, (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        AxiosLog.error(error.response.data);
        AxiosLog.error(error.response.status);
        AxiosLog.error(error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        AxiosLog.error(error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        AxiosLog.error('Error', error.message);
    }
    AxiosLog.log(error.config);

    throw error;
});

app.use(router).use(VueAxios, axios).mount('#app')

router.beforeEach((to, from, next) => {
    if (to.name !== 'Settings' && !config.get('user')) next({name: 'Settings'})
    else next()
})
