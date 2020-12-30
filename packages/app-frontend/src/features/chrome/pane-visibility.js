import { isChrome } from '@utils/env'

let panelShown = !isChrome
let pendingAction = null

if (isChrome) {
  chrome.runtime.onMessage.addListener(request => {
    if (request === 'muban-panel-shown') {
      onPanelShown()
    } else if (request === 'muban-panel-hidden') {
      onPanelHidden()
    }
  })
}

export function ensurePaneShown (cb) {
  if (panelShown) {
    cb()
  } else {
    pendingAction = cb
  }
}

function onPanelShown () {
  panelShown = true
  if (pendingAction) {
    pendingAction()
    pendingAction = null
  }
}

function onPanelHidden () {
  panelShown = false
}
