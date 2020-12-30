// this script is injected into every page.

/**
 * Install the hook on window, which is an event emitter.
 * Note because Chrome content scripts cannot directly modify the window object,
 * we are evaling this function by inserting a script tag. That's why we have
 * to inline the whole event emitter implementation here.
 *
 * @param {Window|global} target
 */

export function installHook (target) {
  let listeners = {}

  if (Object.prototype.hasOwnProperty.call(target, '__MUBAN_DEVTOOLS_GLOBAL_HOOK__')) return

  const hook = {
    Vue: null,
    _buffer: [],
    store: null,
    initialState: null,
    storeModules: null,
    flushStoreModules: null,
    apps: [],

    _replayBuffer (event) {
      const buffer = this._buffer
      this._buffer = []

      for (let i = 0, l = buffer.length; i < l; i++) {
        const allArgs = buffer[i]
        allArgs[0] === event
          // eslint-disable-next-line prefer-spread
          ? this.emit.apply(this, allArgs)
          : this._buffer.push(allArgs)
      }
    },

    on (event, fn) {
      const $event = '$' + event
      if (listeners[$event]) {
        listeners[$event].push(fn)
      } else {
        listeners[$event] = [fn]
        this._replayBuffer(event)
      }
    },

    once (event, fn) {
      const on = (...args) => {
        this.off(event, on)
        fn.apply(this, args)
      }
      this.on(event, on)
    },

    off (event, fn) {
      event = '$' + event
      if (!arguments.length) {
        listeners = {}
      } else {
        const cbs = listeners[event]
        if (cbs) {
          if (!fn) {
            listeners[event] = null
          } else {
            for (let i = 0, l = cbs.length; i < l; i++) {
              const cb = cbs[i]
              if (cb === fn || cb.fn === fn) {
                cbs.splice(i, 1)
                break
              }
            }
          }
        }
      }
    },

    emit (event, ...args) {
      const $event = '$' + event
      let cbs = listeners[$event]
      if (cbs) {
        cbs = cbs.slice()
        for (let i = 0, l = cbs.length; i < l; i++) {
          cbs[i].apply(this, args)
        }
      } else {
        this._buffer.push([event, ...args])
      }
    }
  }

  hook.once('init', Vue => {
    hook.Vue = Vue

    if (Vue) {
      Vue.prototype.$inspect = function () {
        const fn = target.__MUBAN_DEVTOOLS_INSPECT__
        fn && fn(this)
      }
    }
  })

  hook.on('app:init', (app, version, types) => {
    const appRecord = {
      app,
      version,
      types
    }
    hook.apps.push(appRecord)
    hook.emit('app:add', appRecord)
  })

  Object.defineProperty(target, '__MUBAN_DEVTOOLS_GLOBAL_HOOK__', {
    get () {
      return hook
    }
  })
}
