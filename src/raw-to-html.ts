import { ISelectionPosition, IBuffer, IBufferCell } from "xterm";

type PickElsePartial<T, K extends keyof T> =  {[P in keyof T]: K extends P ? T[P] :T[P] | undefined};
export interface RawToHtmlOptions {
  bgColor: string;
  fgColor: string;
  colorMap: Record<string, string>;
}

interface SpanOpen {
  openTag : string
  closeTag : string
}

// hyper/app/utils/colors.txt
const colorList = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "lightBlack",
  "lightRed",
  "lightGreen",
  "lightYellow",
  "lightBlue",
  "lightMagenta",
  "lightCyan",
  "lightWhite",
  "colorCubes",
  "grayscale",
];

const IS_HEX_REGEX = /^#[0-9a-fA-F]{1,}/
type ColorMode = "DEFAULT" | "RGB" | "PALETTE";

const getColorFromColorCode = (
  colorCode: number,
  colorMode: ColorMode,
  defaultColor: string | undefined
): string | undefined => {
  switch (colorMode) {
    case "DEFAULT":
      if (colorCode === -1 || colorCode >= colorList.length) {
        return defaultColor;
      }
      return colorList[colorCode];
    case "PALETTE":
      if (colorCode === -1 || colorCode >= colorList.length) {
        return undefined;
      }
      return colorList[colorCode];
    case "RGB":
      console.error("hyper-copy-as-html RGB color mode not supported.");
      return undefined;
    default:
      return undefined;
  }
};
const getFgColorString = (
  cell: IBufferCell,
  defaultFgColor: string
): string | undefined => {
  const colorMode: ColorMode = cell.isFgDefault()
    ? "DEFAULT"
    : cell.isFgPalette()
    ? "PALETTE"
    : "RGB";
  return getColorFromColorCode(cell.getFgColor(), colorMode, defaultFgColor);
};

const getBgColorString = (cell: IBufferCell): string | undefined => {
  const colorMode: ColorMode = cell.isBgDefault()
    ? "DEFAULT"
    : cell.isBgPalette()
    ? "PALETTE"
    : "RGB";
  return getColorFromColorCode(cell.getBgColor(), colorMode, undefined);
};

const getSpanOpen = (
  {bgColor, fgColor,colorMap, bold}: PickElsePartial<RawToHtmlOptions,'colorMap'> & {bold:boolean}
): SpanOpen => {
  const result: SpanOpen = {
    openTag: "",
    closeTag:""
  }
  if (bold)
  {
    result.openTag += "<b>"
    result.closeTag = "</b>" + result.closeTag
  }

  if (bgColor && fgColor) {
    const fgColorStr = IS_HEX_REGEX.test(fgColor) ? fgColor : colorMap[fgColor]
    const bgColorStr = IS_HEX_REGEX.test(bgColor) ? bgColor : colorMap[bgColor]
    result.openTag += `<span style="color:${fgColorStr};background:${bgColorStr}">`;
   
  } else if (!bgColor && fgColor) {
    const fgColorStr = IS_HEX_REGEX.test(fgColor) ? fgColor : colorMap[fgColor]
    result.openTag +=`<span style="color:${fgColorStr}">`;
  } else if (bgColor && !fgColor) {
    const bgColorStr = IS_HEX_REGEX.test(bgColor) ? bgColor : colorMap[bgColor]
    result.openTag += `<span style="background:${bgColorStr}">`;
  }
  else {
    result.openTag += "<span>";
  }
  result.closeTag = "</span>" + result.closeTag;
  return result;
};

const rawToHtml = (
  selectionPosition: ISelectionPosition,
  buffer: IBuffer,
  { bgColor, fgColor, colorMap }: RawToHtmlOptions
): string => {
  let result = `<pre style="background:${bgColor}">`;
  let spanOpen : SpanOpen = {
    openTag: "<span>",
    closeTag: "</span>"
  };
  for (
    let row = selectionPosition.startRow;
    row <= selectionPosition.endRow;
    row++
  ) {
    const line = buffer.getLine(row)!;
    const firstCol =
      row === selectionPosition.startRow ? selectionPosition.startColumn : 0;
    const lastCol =
      row === selectionPosition.endRow
        ? selectionPosition.endColumn
        : line?.length;

    let lastFgColor = undefined;
    let lastBgColor = undefined;

    for (let col = firstCol; col < lastCol; col++) {
      const cell = line.getCell(col)!;

      // Should only go through this one time per line
      if (!lastFgColor && !lastBgColor) {
        lastFgColor = cell.getFgColor();
        lastBgColor = cell.getBgColor();

        spanOpen = getSpanOpen({
          fgColor: getFgColorString(cell, fgColor),
          bgColor: getBgColorString(cell),
          bold: cell.isBold() !== 0,
          colorMap}
        );
        result += spanOpen.openTag;
        result += cell.getChars();
      } else if (
        cell.getFgColor() !== lastFgColor ||
        cell.getBgColor() !== lastBgColor
      ) {
        result += spanOpen.closeTag;
        lastFgColor = cell.getFgColor();
        lastBgColor = cell.getBgColor();
        spanOpen = getSpanOpen({
          fgColor: getFgColorString(cell, fgColor),
          bgColor: getBgColorString(cell),
          bold: cell.isBold() !== 0,
          colorMap}
        );
        result+= spanOpen.openTag;
        result += cell.getChars();
      } else {
        result += cell.getChars();
      }
    }
    result += "</span>\n";
  }
  result += "</pre>";
  return result;
};

export { rawToHtml };
