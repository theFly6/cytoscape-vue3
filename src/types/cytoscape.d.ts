import type { Core } from 'cytoscape';

export interface ViewUtilitiesInstance {
  removeHighlights: () => void;
  removeHighlightStyle: (x: any) => void;
  highlight: (x: any) => void;
  // 更多方法按需添加...
}

// 新增 LayoutUtilitiesInstance 定义
interface LayoutUtilitiesInstance {
  placeNewNodes: (nodes: Collection) => void;
  // 其他方法根据插件 API 补充
}

// ExpandCollapse 插件实例接口
interface ExpandCollapseInstance {
  collapse: (ele: Collection | any) => void;
  expand: (ele: Collection | any) => void;
  collapseAll: () => void;
  expandAll: () => void;
  isCollapsed: (ele: Collection | any) => boolean;
}

declare module 'cytoscape' {
  interface Core {
    viewUtilities: (options?) => ViewUtilitiesInstance;
    // 扩展 layoutUtilities：支持传入配置或 'get' 获取实例
    layoutUtilities: (options?: any | 'get') => LayoutUtilitiesInstance;
    graphml: (options?: any) => void;

    // 新增 expandCollapse 方法
    expandCollapse: (options?: any) => ExpandCollapseInstance;
  }

  interface Style {
    json: () => Array<{ selector: string; style: { [key: string]: any } }>;
  }
}
