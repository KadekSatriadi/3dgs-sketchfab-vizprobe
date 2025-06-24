import { createApp } from 'vue'
import App from './App.vue'

// Enable SharedArrayBuffer
// if (typeof SharedArrayBuffer === 'undefined') {
//   import('coi-serviceworker').then(({ register }) => {
//     register();
//   });
// }

createApp(App).mount('#app')
