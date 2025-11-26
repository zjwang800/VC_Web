import { App } from "vue";
import { VcTable } from "./components/table";
import { VcMenu } from "./components/menu";
import { VcEChart } from "./components/echarts";
import { VcResizeDraggable } from "./components/draggable";
import { VcImportFile } from "./components/import-file";
import { VcEditTable } from "./components/edit-table";

const elmPlusComponents = [
  VcTable,
  VcMenu,
  VcEChart,
  VcResizeDraggable,
  VcImportFile,
  VcEditTable,
];

export const installer = (app: App) => {
  elmPlusComponents.forEach((comp) => app.use(comp));
};
