import {App} from 'vue'
import { VcTable } from './components/table'
import { VcMenu } from './components/menu'
import { VcEChart } from './components/echarts'
import { VcResizeDraggable } from './components/draggable'

const elmPlusComponents = [
  VcTable,
  VcMenu,
  VcEChart,
  VcResizeDraggable
]

export const installer = (app: App) => {
  elmPlusComponents.forEach((comp) => app.use(comp))
}
