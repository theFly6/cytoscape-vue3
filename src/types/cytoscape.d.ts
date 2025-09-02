import type { Core } from 'cytoscape';

interface ViewUtilitiesInstance {
  removeHighlights: () => void;
  removeHighlightStyle: (x: any) => void;
  highlight: (x: any)=> void;
  // 更多方法按需添加...
}

// 新增 LayoutUtilitiesInstance 定义
interface LayoutUtilitiesInstance {
  placeNewNodes: (nodes: Collection) => void;
  // 其他方法根据插件 API 补充
}

declare module 'cytoscape' {
  interface Core {
    viewUtilities: (options?) => ViewUtilitiesInstance;
    // 扩展 layoutUtilities：支持传入配置或 'get' 获取实例
    layoutUtilities: (options?: any | 'get') => LayoutUtilitiesInstance;
    graphml: (options?: any)=> void;
  }
}
