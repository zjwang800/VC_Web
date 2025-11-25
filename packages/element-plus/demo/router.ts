import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/table-custom-columns',
      component: () => import('./table/table-custom-columns.vue'),
      name: 'TableCustomColumns'
    },
    {
      path: '/data-picker-shortcuts',
      component: () => import('./data-picker/data-picker-shortcuts.vue'),
      name: 'DataPickerShortcuts'
    },
    {
      path: '/menu-voice-cloud',
      component: () => import('./menu/menu-voice-cloud.vue'),
      name: 'MenuVoiceCloud'
    },{
      path:'/line-echart',
      component: () => import('./echart/line-echart.vue'),
      name: 'LineEchart'
    },
    {
      path: '/draggable',
      component: () => import('./draggable/draggable.vue'),
      name: 'Draggable'
    },
    {
      path: '/ai-mark',
      component: () => import('./ai-mark/ai-mark.vue'),
      name: 'AiMark'
    },
    {
      path: '/playback-timeline',
      component: () => import('./playback-timeline/playback-timeline.vue'),
      name: 'PlaybackTimeline'
    },
    {
      path: '/typing-effect',
      component: () => import('./typing-effect/typing-effect.vue'),
      name: 'TypingEffect'
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/table-custom-columns'
    },
  ]
})

export default router
