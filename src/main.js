import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import './assets/index.css'
import axios from 'axios'
import VueAxios from 'vue-axios'
import {ipcRenderer} from 'electron'
import config from 'electron-cfg';

const app = createApp(App)

app.config.globalProperties.$apiEndpointUrl = ipcRenderer.sendSync('get-api-endpoint-url')

app.config.globalProperties.$phoenixBaseUrl = ipcRenderer.sendSync('get-phoenixbase-url')

app.use(router).use(VueAxios, axios).mount('#app')

router.beforeEach((to, from, next) => {
    if (to.name !== 'Settings' && !config.get('user')) next({name: 'Settings'})
    else next()
})
