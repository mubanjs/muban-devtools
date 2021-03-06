<template>
  <div class="data-wrapper">
    <template v-for="(dataType, index) in dataTypes">
      <div
        v-if="defer(index + 1)"
        :key="dataType"
        :class="[
          'data-el',
          toDisplayType(dataType, true),
          {
            'high-density': highDensity,
            dim: dimAfter !== -1 && index >= dimAfter
          }
        ]"
      >
        <div
          v-tooltip="{
            content: $t('StateInspector.dataType.tooltip'),
            contentHtml: true,
            placement: orientation === 'landscape' ? 'left' : 'top'
          }"
          class="data-type selectable-item"
          @click="toggle(dataType, $event)"
        >
          <span
            :class="{ rotated: isExpanded(dataType) }"
            class="arrow right"
          />
          <span class="key flex-1">
            <slot
              name="key"
              :dataType="dataType"
            >
              {{ toDisplayType(dataType) }}
            </slot>
          </span>
        </div>
        <StateFields
          v-show="isExpanded(dataType)"
          :fields="state[dataType]"
          :force-collapse="forceCollapse"
          @edit-state="(path, payload) => $emit('edit-state', path, payload)"
        />
      </div>
    </template>
  </div>
</template>

<script>
import Vue from 'vue'
import Defer from '@front/mixins/defer'
import StateFields from './StateFields.vue'
import { useOrientation } from '../layout/orientation'

const keyOrder = {
  props: 1,
  refs: 2,
  bindings: 3,
  'bindings (self)': 3,
  context: 4,
  parents: 9,
  undefined: 5
  // computed: 4,
  // 'register module': 1,
  // 'unregister module': 1,
  // setup: 2,
  // state: 2,
  // getters: 3,
  // mutation: 1,
  // 'vuex bindings': 5,
  // $refs: 6,
  // $attrs: 7
}

export default {
  components: {
    StateFields
  },

  mixins: [
    Defer()
  ],

  props: {
    state: {
      type: Object,
      required: true
    },

    dimAfter: {
      type: Number,
      default: -1
    }
  },

  setup () {
    const { orientation } = useOrientation()

    return {
      orientation
    }
  },

  data () {
    return {
      expandedState: {},
      forceCollapse: null
    }
  },

  computed: {
    dataTypes () {
      return Object.keys(this.state).sort((a, b) => {
        return (
          (keyOrder[a] || (a.charCodeAt(0) + 999)) -
          (keyOrder[b] || (b.charCodeAt(0) + 999))
        )
      })
    },

    totalCount () {
      return Object.keys(this.state).reduce((total, state) => total + state.length, 0)
    },

    highDensity () {
      const pref = this.$shared.displayDensity
      return (pref === 'auto' && this.totalCount > 12) || pref === 'high'
    }
  },

  watch: {
    state () {
      this.forceCollapse = null
    }
  },

  methods: {
    toDisplayType (dataType, asClass) {
      return dataType === 'undefined'
        ? 'data'
        : asClass
          ? dataType.replace(/\s/g, '-')
          : dataType
    },

    isExpanded (dataType) {
      const value = this.expandedState[dataType]
      return typeof value === 'undefined' || value
    },

    toggle (dataType, event = null) {
      if (event) {
        if (event.ctrlKey || event.metaKey) {
          this.setExpandToAll(false)
          this.$emit('collapse-all')
          return
        } else if (event.shiftKey) {
          this.setExpandToAll(true)
          this.$emit('expand-all')
          return
        }
      }
      Vue.set(this.expandedState, dataType, !this.isExpanded(dataType))
    },

    setExpandToAll (value) {
      this.dataTypes.forEach(key => {
        this.forceCollapse = value ? 'expand' : 'collapse'
        Vue.set(this.expandedState, key, value)
      })
    }
  }
}
</script>

<style lang="stylus">
.data-el
  font-size 15px

  &.dim
    opacity .7
    pointer-events none
    user-select none
    filter grayscale(50%)

  &:not(:last-child)
    border-bottom rgba($grey, .4) solid 1px

    .vue-ui-dark-mode &
      border-bottom-color rgba($grey, .07)

  .vue-ui-dark-mode &
    box-shadow none

  .data-type,
  .data-fields
    margin 5px
    padding 2px 9px 2px 21px
    @media (max-height: $tall)
      margin 0
      padding 0 9px 0 21px

  .data-type
    color $blueishGrey
    position relative
    cursor pointer
    border-radius 3px
    display flex
    align-items center
    padding-left 9px
    user-select none

    .vue-ui-dark-mode &
      color lighten(#486887, 30%)

    .arrow
      transition transform .1s ease
      margin-right 8px
      opacity .7
      &.rotated
        transform rotate(90deg)

  .data-fields
    padding-top 0
    @media (max-height: $tall)
      margin-bottom 4px

</style>
