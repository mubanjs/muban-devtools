import { getTarget, getDevtoolsGlobalHook } from './env'
import { HOOK_SETUP } from './const'
import { DevtoolsPluginApi, App } from './api'

export * from './api'

export interface PluginDescriptor {
  id: string
  label: string
  app: App
}

export type SetupFunction = (api: DevtoolsPluginApi) => void

export function setupDevtoolsPlugin (pluginDescriptor: PluginDescriptor, setupFn: SetupFunction) {
  const hook = getDevtoolsGlobalHook()
  if (hook) {
    hook.emit(HOOK_SETUP, pluginDescriptor, setupFn)
  } else {
    const target = getTarget()
    const list = target.__MUBAN_DEVTOOLS_PLUGINS__ = target.__MUBAN_DEVTOOLS_PLUGINS__ || []
    list.push({
      pluginDescriptor,
      setupFn
    })
  }
}
