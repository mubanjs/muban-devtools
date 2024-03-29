import { DevtoolsBackend, BuiltinBackendFeature, DevtoolsApi } from '@muban-devtools/app-backend-api'
import { ComponentWalker } from './components/tree'
import { editState, getInstanceDetails } from './components/data'
import { getInstanceName } from './components/util'
import { getComponentInstanceFromElement, getInstanceOrVnodeRect, getRootElementsFromComponentInstance } from './components/el'
import { HookEvents } from '@muban-devtools/shared-utils'

export const backend: DevtoolsBackend = {
  frameworkVersion: 10,

  availableFeatures: [
    BuiltinBackendFeature.COMPONENTS
  ],

  setup (api: DevtoolsApi) {
    api.on.getAppRecordName(payload => {
      if (payload.app._component) {
        payload.name = payload.app._component.displayName
      }
    })

    api.on.getAppRootInstance(payload => {
      if (payload.app._instance) {
        payload.root = payload.app._instance
      }
    })

    api.on.walkComponentTree((payload, ctx) => {
      const walker = new ComponentWalker(payload.maxDepth, payload.filter, ctx)
      payload.componentTreeData = walker.getComponentTree(payload.componentInstance)
    })

    api.on.walkComponentParents((payload, ctx) => {
      const walker = new ComponentWalker(0, null, ctx)
      payload.parentInstances = walker.getComponentParents(payload.componentInstance)
    })

    api.on.inspectComponent(async (payload, ctx) => {
      payload.instanceData = await getInstanceDetails(payload.componentInstance, ctx)
    })

    api.on.getComponentName(async payload => {
      payload.name = await getInstanceName(payload.componentInstance)
    })

    api.on.getComponentBounds(async payload => {
      payload.bounds = await getInstanceOrVnodeRect(payload.componentInstance)
    })

    api.on.getElementComponent(payload => {
      payload.componentInstance = getComponentInstanceFromElement(payload.element)
    })

    api.on.getComponentRootElements(payload => {
      payload.rootElements = getRootElementsFromComponentInstance(payload.componentInstance)
    })

    api.on.editComponentState((payload, ctx) => {
      editState(payload, ctx)
    })

    api.on.transformCall(payload => {
      if (payload.callName === HookEvents.COMPONENT_UPDATED) {
        const component = payload.inArgs[0]
        payload.outArgs = [
          component.appContext.app,
          component.uid,
          component.parent ? component.parent.uid : undefined
        ]
      }
    })
  }
} as DevtoolsBackend
