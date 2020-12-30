import { installToast } from '@back/toast'
import { isFirefox } from '@utils/env'

window.addEventListener('message', e => {
  if (e.source === window && e.data.mubanDetected) {
    chrome.runtime.sendMessage(e.data)
  }
})

function detect (win) {
  setTimeout(() => {
    // Method 2: Check  Vue 3
    const mubanDetected = !!(window.__MUBAN__)
    if (mubanDetected) {
      win.postMessage({
        // TODO disable devtools
        devtoolsEnabled: true,
        mubanDetected: true
      }, '*')
    }

    // Method 3: Scan all elements inside document
    // const all = document.querySelectorAll('*')
    // let el
    // for (let i = 0; i < all.length; i++) {
    //   if (all[i].__vue__) {
    //     el = all[i]
    //     break
    //   }
    // }
    // if (el) {
    //   let Vue = Object.getPrototypeOf(el.__vue__).constructor
    //   while (Vue.super) {
    //     Vue = Vue.super
    //   }
    //   win.postMessage({
    //     devtoolsEnabled: Vue.config.devtools,
    //     mubanDetected: true
    //   }, '*')
    // }
  }, 100)
}

// inject the hook
if (document instanceof HTMLDocument) {
  installScript(detect)
  installScript(installToast)
}

function installScript (fn) {
  const source = ';(' + fn.toString() + ')(window)'

  if (isFirefox) {
    // eslint-disable-next-line no-eval
    window.eval(source) // in Firefox, this evaluates on the content window
  } else {
    const script = document.createElement('script')
    script.textContent = source
    document.documentElement.appendChild(script)
    script.parentNode.removeChild(script)
  }
}
