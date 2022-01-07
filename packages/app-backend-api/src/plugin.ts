import { PluginDescriptor, SetupFunction } from '@muban/devtools-api'

export interface Plugin {
  descriptor: PluginDescriptor
  setupFn: SetupFunction
  error: Error
}
