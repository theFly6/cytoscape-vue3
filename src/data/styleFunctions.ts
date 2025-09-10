// styleFunctions.ts
import { fullColorHex } from './cytoscape-data'

// 函数用于获取节点的背景色。它首先从节点数据中读取 "color" 属性，如果没有该属性，则返回默认颜色 #756D76
export const nodeBackgroundColor = (ele: any) => {
  let colors = ele.data("color");
  if (!colors) return "#756D76";
  colors = colors.split(" ");
  return "#" + fullColorHex(colors[0], colors[1], colors[2]);
};

//  函数用于获取节点的形状。它从节点数据中读取 "shape" 属性，并将其转换为小写字符串返回。
export const nodeShape = (ele: any) => {
  const str = "" + ele.data("shape");
  return str.toLowerCase();
};

// 函数用于获取边的线条颜色。它首先获取边的源节点和目标节点的颜色，并将其转换为 RGB 颜色格式。如果源节点和目标节点的颜色相同，则返回该颜色，否则返回默认颜色 #756D76。
export const edgeLineColor = (ele: any) => {
  let source = ele.source();
  let sColors = source.data("color");
  if (!sColors) return "#756D76";
  sColors = sColors.split(" ");
  const sRgbColor = "#" + fullColorHex(sColors[0], sColors[1], sColors[2]);

  let target = ele.target();
  let tColors = target.data("color").split(" ");
  const tRgbColor = "#" + fullColorHex(tColors[0], tColors[1], tColors[2]);

  return sRgbColor === tRgbColor ? sRgbColor : "#756D76";
};


// 将 "rgb(58, 196, 225)" 转为 "58 196 225"
export function rgbToNumberString(rgb: string): string {
  const match = rgb.match(/\d+/g)
  return match ? match.join(' ') : rgb
}

// 将 "ellipse" -> "Ellipse"（你要求首字母大写的 "Rectangle"）
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 模拟将字体族转换为你自定义的字体描述字符串（这里写死了）
export function convertFontToCustomString(fontFamily: string): string {
  // 可根据实际逻辑处理 fontFamily → 你那种复杂字符串
  return '1|Arial|8|0|WINDOWS|1|-11|0|0|0|0|0|0|0|1|0|0|0|0|Arial'
}