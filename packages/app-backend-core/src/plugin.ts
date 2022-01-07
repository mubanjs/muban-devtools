import { PluginDescriptor, SetupFunction } from '@muban/devtools-api'
import { Plugin, BackendContext, DevtoolsPluginApiInstance } from '@muban-devtools/app-backend-api'
import { BridgeEvents, target } from '@muban-devtools/shared-utils'
import { getAppRecordId } from './app'

export function addPlugin (pluginDescriptor: PluginDescriptor, setupFn: SetupFunction, ctx: BackendContext) {
  const plugin: Plugin = {
    descriptor: pluginDescriptor,
    setupFn,
    error: null
  }
  ctx.currentPlugin = plugin
  try {
    const api = new DevtoolsPluginApiInstance(plugin, ctx)
    setupFn(api)
  } catch (e) {
    plugin.error = e
    console.error(e)
  }
  ctx.currentPlugin = null
  ctx.plugins.push(plugin)
  ctx.bridge.send(BridgeEvents.TO_FRONT_DEVTOOLS_PLUGIN_ADD, {
    plugin: serializePlugin(plugin)
  })

  const targetList = target.__MUBAN_DEVTOOLS_REGISTERED_PLUGINS__ = target.__MUBAN_DEVTOOLS_REGISTERED_PLUGINS__ || []
  targetList.push({
    pluginDescriptor,
    setupFn
  })
}

export async function addQueuedPlugins (ctx: BackendContext) {
  if (target.__MUBAN_DEVTOOLS_PLUGINS__ && Array.isArray(target.__MUBAN_DEVTOOLS_PLUGINS__)) {
    for (const k in target.__MUBAN_DEVTOOLS_PLUGINS__) {
      const plugin = target.__MUBAN_DEVTOOLS_PLUGINS__[k]
      addPlugin(plugin.pluginDescriptor, plugin.setupFn, ctx)
    }
    target.__MUBAN_DEVTOOLS_PLUGINS__ = null
  }
}

export async function addPreviouslyRegisteredPlugins (ctx: BackendContext) {
  if (target.__MUBAN_DEVTOOLS_REGISTERED_PLUGINS__ && Array.isArray(target.__MUBAN_DEVTOOLS_REGISTERED_PLUGINS__)) {
    for (const k in target.__MUBAN_DEVTOOLS_REGISTERED_PLUGINS__) {
      const plugin = target.__MUBAN_DEVTOOLS_REGISTERED_PLUGINS__[k]
      addPlugin(plugin.pluginDescriptor, plugin.setupFn, ctx)
    }
  }
}

export function sendPluginList (ctx: BackendContext) {
  ctx.bridge.send(BridgeEvents.TO_FRONT_DEVTOOLS_PLUGIN_LIST, {
    plugins: ctx.plugins.map(p => serializePlugin(p))
  })
}

export function serializePlugin (plugin: Plugin) {
  return {
    id: plugin.descriptor.id,
    label: plugin.descriptor.label,
    appId: getAppRecordId(plugin.descriptor.app)
  }
}
