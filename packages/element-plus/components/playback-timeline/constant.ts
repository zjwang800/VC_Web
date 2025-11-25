// 一小时的毫秒数
export const ONE_HOUR_STAMP = 60 * 60 * 1000
// 时间分辨率，即整个时间轴表示的时间范围
export const ZOOM = [0.5, 1, 2, 6, 12, 24, 72, 360, 720, 8760, 87600] // 半小时、1小时、2小时、6小时、12小时、1天、3天、15天、30天、365天、365*10天
// 时间分辨率对应的每格小时数，即最小格代表多少小时
export const ZOOM_HOUR_GRID = [1 / 60, 1 / 60, 2 / 60, 1 / 6, 0.25, 0.5, 1, 4, 4, 720, 7200]
export const MOBILE_ZOOM_HOUR_GRID = [1 / 20, 1 / 30, 1 / 20, 1 / 3, 0.5, 2, 4, 4, 4, 720, 7200]
// 时间分辨率对应的时间显示判断条件
export const ZOOM_DATE_SHOW_RULE = [
  () => {
    // 全部显示
    return true
  },
  (date: { getMinutes: () => number }) => {
    // 每五分钟显示
    return date.getMinutes() % 5 === 0
  },
  (date: { getMinutes: () => number }) => {
    // 每十分钟显示
    return date.getMinutes() % 10 === 0
  },
  (date: { getMinutes: () => number }) => {
    // 整点和半点显示
    return date.getMinutes() === 0 || date.getMinutes() === 30
  },
  (date: { getMinutes: () => number }) => {
    // 整点显示
    return date.getMinutes() === 0
  },
  (date: { getHours: () => number; getMinutes: () => number }) => {
    // 偶数整点的小时
    return date.getHours() % 2 === 0 && date.getMinutes() === 0
  },
  (date: { getHours: () => number; getMinutes: () => number }) => {
    // 每三小时小时
    return date.getHours() % 3 === 0 && date.getMinutes() === 0
  },
  (date: { getHours: () => number; getMinutes: () => number }) => {
    // 每12小时
    return date.getHours() % 12 === 0 && date.getMinutes() === 0
  },
  (date: any) => {
    // 全不显示
    return false
  },
  (date: any) => {
    return true
  },
  (date: any) => {
    return true
  }
]
export const MOBILE_ZOOM_DATE_SHOW_RULE = [
  () => {
    // 全部显示
    return true
  },
  (date: { getMinutes: () => number }) => {
    // 每五分钟显示
    return date.getMinutes() % 5 === 0
  },
  (date: { getMinutes: () => number }) => {
    // 每十分钟显示
    return date.getMinutes() % 10 === 0
  },
  (date: { getMinutes: () => number }) => {
    // 整点和半点显示
    return date.getMinutes() === 0 || date.getMinutes() === 30
  },
  (date: { getHours: () => number; getMinutes: () => number }) => {
    // 偶数整点的小时
    return date.getHours() % 2 === 0 && date.getMinutes() === 0
  },
  (date: { getHours: () => number; getMinutes: () => number }) => {
    // 偶数整点的小时
    return date.getHours() % 4 === 0 && date.getMinutes() === 0
  },
  (date: { getHours: () => number; getMinutes: () => number }) => {
    // 每三小时小时
    return date.getHours() % 3 === 0 && date.getMinutes() === 0
  },
  (date: { getHours: () => number; getMinutes: () => number }) => {
    // 每12小时
    return date.getHours() % 12 === 0 && date.getMinutes() === 0
  },
  (date: any) => {
    // 全不显示
    return false
  },
  (date: any) => {
    return true
  },
  (date: any) => {
    return true
  }
]
export interface TimeRange {
  start: string // 允许显示的最小时间
  end: string // 允许显示的最大时间
}
export interface CenterLineStyle {
  width: number // 允许显示的最小时间
  color: string // 允许显示的最大时间
}
export interface TimeSegment {
  beginTime: number // 起始时间戳
  endTime: number // 结束时间戳
  color: string // 颜色
  startRatio: number // 高度的起始比例，即top=时间轴高度*startRatio
  endRatio?: number // 高度的结束比例，即bottom=时间轴高度*endRatio
  duration?: number //录像持续时间
  name?: string // 录像名称
}
export interface WindowList {
  index: number
  name: string
  timeSegments?: TimeSegment[]
}
export interface LineHeightRatio {
  date: number // 0点时的日期线段高度
  time: number // 显示时间的线段高度
  none: number // 不显示时间的线段高度
  hover: number // 鼠标滑过时显示的时间段高度
}
export interface ExtendZOOM {
  zoom: number // 时间分辨率，整个时间轴表示的时间范围，单位：小时
  zoomHourGrid: number // 时间分辨率对应的每格小时数，即时间轴上最小格代表多少小时
}
export interface WindowListInner {
  index: number
  name: string
  active: boolean
  timeSegments?: TimeSegment[]
}
export interface WatchTime {
  time: number
  windowTimeLineIndex: number
  callback: (x: number, y: number) => any
}
