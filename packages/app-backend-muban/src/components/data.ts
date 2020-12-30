import { BackendContext } from '@vue-devtools/app-backend-api'
import { getInstanceName, getUniqueComponentId } from './util'
import { camelize, classify, get, set } from '@vue-devtools/shared-utils'
import SharedData from '@vue-devtools/shared-utils/lib/shared-data'
import { HookPayloads, Hooks, InspectedComponentData } from '@vue/devtools-api'

/**
 * Get the detailed information of an inspected instance.
 */
export async function getInstanceDetails (instance: any, ctx: BackendContext): Promise<InspectedComponentData> {
  return {
    id: getUniqueComponentId(instance, ctx),
    name: getInstanceName(instance),
    file: instance.type?.__file,
    state: await getInstanceState(instance)
  }
}

async function getInstanceState (instance) {
  if (instance.type === 'component') {
    return [
      ...processProps(instance),
      ...processRefs(instance),
      ...processBindings(instance),
      ...processParents(instance),
      ...processProvide(instance)
    ]
  } else {
    // ref
    return [
      ...processBindings(instance),
      ...processOwner(instance)
    ]
  }
}

/**
 * Process the props of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */
function processProps (instance) {
  const propsData = []

  for (let key in instance.options.props) {
    key = camelize(key)
    const info = instance.options.props[key]
    propsData.push({
      type: 'props',
      key,
      value: instance.reactiveProps[key],
      meta: {
        type: info.type.name,
        required: !info.isOptional,
        ...info.default != null ? {
          default: info.default.toString()
        } : {},
        initialValue: instance.props[key]
      },
      editable: SharedData.editableProps
    })
  }
  return propsData
}

/**
 * Process the refs of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */
function processRefs (instance) {
  const refsData = []

  for (let key in instance.options.refs) {
    key = camelize(key)
    const info = instance.options.refs[key]
    refsData.push({
      type: 'refs',
      key,
      value: getRefValue(instance.refs[key]),
      meta: {
        type: instance.refs[key].type,
        required: false, // TODO
        query: getRefQuery(info)
      },
      editable: false // SharedData.editableProps
    })
  }
  return refsData
}

function getRefValue (ref) {
  switch (ref.type) {
    case 'element':
      return ref.element
    case 'collection':
      return ref.elements
    case 'component':
      return ref.component
    case 'componentCollection':
      return ref.components
  }
}

function getRefQuery (ref) {
  if (!['string', 'function'].includes(typeof ref)) {
    if (ref.type === 'element' || ref.type === 'collection') {
      // data-ref
      return ref.ref
    }

    return `${ref.ref ? `${ref.ref} ` : ''}[${ref.componentRef}]`
  }

  // string shortcut
  if (typeof ref === 'string') {
    return ref
  }

  // function shortcut
  return '[custom query]'
}

/**
 * Process the bindings of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */
function processBindings (instance) {
  const bindingsData = []

  // ...(instance.bindings
  if (instance.type === 'component') {
    bindingsData.push(...createBindingProps(
      instance.refChildren.find(refComponent => refComponent.element === instance.element)?.binding.props || {}, 'bindings (self)'
    ))
    bindingsData.push(...createBindingProps(
      instance.parent?.refChildren.find(refComponent => refComponent.element === instance.element)?.binding.props || {}, 'bindings'
    ))
  } else {
    bindingsData.push(...createBindingProps(instance.binding.props, 'bindings'))
  }
  return bindingsData
}

function createBindingProps (bindings, type) {
  // TODO: unpack nested computes into dot.paths with own info, e.g.
  //  - event.click, event.mouseup
  //  - css.is-active, css.someClass
  //  - attr.data-foo, attr.data-bar
  //  benefit of this is that it will show the actual computed info
  return Object.entries(bindings).map(([key, value]) => {
    return {
      type: type,
      key: key,
      value: recursiveUnref(value),
      ...getExtraState(value),
      editable: false // SharedData.editableProps
    }
  })
}

function recursiveUnref (source: any): any {
  const value = unref(source)
  if (Array.isArray(value)) {
    return value.map(recursiveUnref)
  }
  if (String(value) === '[object Object]') {
    return mapValues(value, recursiveUnref)
  }
  return value
}

const mapValues = (obj, fn) => {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value, key)]))
}

/**
 * Process the parents of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */
function processParents (instance) {
  const parentsData = getParents(instance).map(parent => ({
    type: 'parents',
    key: `<${classify(parent.name)}>`,
    value: `<${parent.element.tagName.toLowerCase()} data-component="${parent.name}" />`
  }))
  return parentsData
}

function getParents (instance) {
  const parents = []
  let ref = instance
  while (ref.parent) {
    ref = ref.parent
    parents.push(ref)
  }
  return parents
}

/**
 * Process the owner of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */
function processOwner (instance) {
  return [{
    type: 'owner',
    key: `<${classify(instance.parent.name)}>`,
    value: `<${instance.parent.element.tagName.toLowerCase()} data-component="${instance.parent.name}" />`
  }]
}

/**
 * Process the provides of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */
function processProvide (instance) {
  const providesData = []

  for (const key in instance.provides) {
    const info = instance.provides[key]
    providesData.push({
      type: 'provide',
      key,
      value: recursiveUnref(info),
      ...getExtraState(info)
      // editable: false // SharedData.editableProps
    })
  }
  return providesData
}

function getExtraState (raw) {
  if (!raw) return {}

  const info = getSetupStateInfo(raw)

  const objectType = info.computed ? 'Computed' : info.ref ? 'Ref' : info.reactive ? 'Reactive' : null

  return {
    ...objectType ? { objectType } : {},
    ...raw.effect ? { raw: raw.effect.raw.toString() } : {},
    editable: (info.ref || info.computed || info.reactive) && !info.readonly
  }
}

function isRef (raw: any): boolean {
  return !!raw.__v_isRef
}

function isComputed (raw: any): boolean {
  return isRef(raw) && !!raw.effect
}

function isReactive (raw: any): boolean {
  return !!raw.__v_isReactive
}

function isReadOnly (raw: any): boolean {
  return !!raw.__v_isReadonly
}

function getSetupStateInfo (raw: any) {
  return {
    ref: isRef(raw),
    computed: isComputed(raw),
    reactive: isReactive(raw),
    readonly: isReadOnly(raw)
  }
}

function unref (ref) {
  return isRef(ref) ? ref.value : ref
}

export function editState ({ componentInstance, path, state }: HookPayloads[Hooks.EDIT_COMPONENT_STATE], ctx: BackendContext) {
  console.log('EDIT STATE', componentInstance, path, state)
  let target: any
  const targetPath: string[] = path.slice()

  if (Object.keys(componentInstance.provides).includes(path[0])) {
    // Provides
    target = componentInstance.provides

    const currentValue = get(componentInstance.provides, path)
    if (currentValue != null) {
      const info = getSetupStateInfo(currentValue)

      if (info.readonly) return
      if (info.ref) {
        targetPath.splice(1, 0, 'value')
      }
    }
  } else if (Object.keys(componentInstance.props).includes(path[0])) {
    // Props
    target = componentInstance.reactiveProps
  } else if (Object.keys(componentInstance.devtoolsRawSetupState).includes(path[0])) {
    // Setup
    target = componentInstance.devtoolsRawSetupState

    const currentValue = get(componentInstance.devtoolsRawSetupState, path)
    if (currentValue != null) {
      const info = getSetupStateInfo(currentValue)

      if (info.readonly) return
      if (info.ref) {
        targetPath.splice(1, 0, 'value')
      }
    }
  }

  if (target && targetPath) {
    set(target, targetPath, 'value' in state ? state.value : undefined, (obj, field, value) => {
      if (state.remove || state.newKey) {
        if (Array.isArray(obj)) {
          obj.splice(field, 1)
        } else {
          delete obj[field]
        }
      }
      if (!state.remove) {
        obj[state.newKey || field] = value
      }
    })
  }
}
