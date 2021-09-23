import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import './assets/index.css'
import axios from 'axios'
import VueAxios from 'vue-axios'
import {ipcRenderer} from 'electron'

const app = createApp(App)

app.config.globalProperties.$apiEndpointUrl = ipcRenderer.sendSync('get-api-endpoint-url')

app.use(router).use(VueAxios, axios).mount('#app')
