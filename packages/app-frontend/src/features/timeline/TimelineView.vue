<script>
import { Application, Container, Graphics, Rectangle } from 'pixi.js'
import { ref, onMounted, onUnmounted, watch } from '@vue/composition-api'
import { useBridge } from '../bridge'
import { BridgeEvents } from '@vue-devtools/shared-utils'
import { useLayers, useTime, useSelectedEvent } from '.'
import Vue from 'vue'

export default {
  setup () {
    const wrapper = ref(null)

    // App

    /** @type {Application} */
    let app

    onMounted(() => {
      app = new Application({
        resizeTo: wrapper.value,
        backgroundColor: 0xffffff,
        antialias: true
      })
      wrapper.value.appendChild(app.view)
    })

    onUnmounted(() => {
      app.destroy()
    })

    // Layers

    const { layers } = useLayers()
    const layerContainers = []
    const layersMap = {}

    onMounted(() => {
      let y = 0
      for (const layer of layers.value) {
        const container = new Container()
        container.y = y
        y += 32
        app.stage.addChild(container)
        layerContainers.push(container)
        layersMap[layer.id] = {
          layer,
          container
        }
      }
    })

    // Events

    const { startTime, endTime, minTime } = useTime()
    const { selectedEvent } = useSelectedEvent()
    const { onBridge } = useBridge()

    const events = []

    function updateEventPosition (event, g) {
      g.x = (event.time - minTime.value) / (endTime.value - startTime.value) * app.view.width
    }

    function addEvent (event, layer, container) {
      // Graphics
      const g = new Graphics()
      g.beginFill(layer.color)
      g.drawCircle(0, 0, 4)
      updateEventPosition(event, g)
      g.y = 16
      container.addChild(g)

      // Refs
      event.layer = layer
      event.g = g

      events.push(event)

      return event
    }

    onMounted(() => {
      for (const k in layersMap) {
        const { layer, container } = layersMap[k]
        for (const event of layer.events) {
          addEvent(event, layer, container)
        }
      }
    })

    onBridge(BridgeEvents.TO_FRONT_TIMELINE_EVENT, ({ layerId, event }) => {
      const { layer, container } = layersMap[layerId]
      addEvent(event, layer, container)
    })

    let eventsUpdateQueued = false

    function queueEventsUpdate () {
      if (eventsUpdateQueued) return
      eventsUpdateQueued = true
      Vue.nextTick(() => {
        updateEvents()
        eventsUpdateQueued = false
      })
    }

    function updateEvents () {
      for (const event of events) {
        updateEventPosition(event, event.g)
      }
    }

    watch(startTime, () => queueEventsUpdate())
    watch(endTime, () => queueEventsUpdate())
    watch(minTime, () => queueEventsUpdate())

    // Event selection

    onMounted(() => {
      app.stage.interactive = true
      app.stage.hitArea = new Rectangle(0, 0, 100000, 100000)
      app.stage.addListener('click', event => {
        // Unselect previous event
        if (selectedEvent.value) {
          const g = selectedEvent.value.g
          g.clear()
          g.beginFill(selectedEvent.value.layer.color)
          g.drawCircle(0, 0, 4)
        }

        let choice
        let distance = Number.POSITIVE_INFINITY
        for (const e of events) {
          if (!choice) {
            choice = e
            continue
          }

          const globalPosition = e.g.getGlobalPosition()
          const d = Math.abs(globalPosition.x - event.data.global.x) + Math.abs(globalPosition.y - event.data.global.y)

          if (d < distance) {
            choice = e
            distance = d
          }
        }
        selectedEvent.value = choice

        // Update graphics
        if (choice) {
          const g = choice.g
          g.clear()
          g.beginFill(choice.layer.color)
          g.drawCircle(0, 0, 7)
        }
      })
    })

    // Camera

    let cameraUpdateQueued = false

    function queueCameraUpdate () {
      if (cameraUpdateQueued) return
      cameraUpdateQueued = true
      Vue.nextTick(() => {
        updateCamera()
        cameraUpdateQueued = false
      })
    }

    function updateCamera () {
      app.stage.x = -(startTime.value - minTime.value) / (endTime.value - startTime.value) * app.view.width
    }

    watch(startTime, () => queueCameraUpdate())
    watch(endTime, () => queueCameraUpdate())

    // Resize

    function onResize () {
      app.queueResize()
      queueEventsUpdate()
    }

    return {
      wrapper,
      onResize
    }
  }
}
</script>

<template>
  <div
    ref="wrapper"
    class="relative overflow-hidden"
  >
    <resize-observer @notify="onResize" />
  </div>
</template>