import { ISelectionPosition, IBuffer, IBufferCell } from "xterm";

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
  fgColor: string | undefined,
  bgColor: string | undefined,
  colorMap: Record<string, string>
): string => {
  if (bgColor && fgColor) {
    return `<span style="color:${colorMap[fgColor]};background:${colorMap[bgColor]}">`;
  } else if (!bgColor && fgColor) {
    return `<span style="color:${colorMap[fgColor]}">`;
  } else if (bgColor && !fgColor) {
    return `<span style="background:${colorMap[bgColor]}">`;
  }
  return "<span>";
};

export interface RawToHtmlOptions {
  bgColor: string;
  fgColor: string;
  colorMap: Record<string, string>;
}

const rawToHtml = (
  selectionPosition: ISelectionPosition,
  buffer: IBuffer,
  { bgColor, fgColor, colorMap }: RawToHtmlOptions
): string => {
  let result = `<pre style="background:${bgColor}">`;
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

        result += getSpanOpen(
          getFgColorString(cell, fgColor),
          getBgColorString(cell),
          colorMap
        );
        result += cell.getChars();
      } else if (
        cell.getFgColor() !== lastFgColor ||
        cell.getBgColor() !== lastBgColor
      ) {
        result += "</span>";
        lastFgColor = cell.getFgColor();
        lastBgColor = cell.getBgColor();
        result += getSpanOpen(
          getFgColorString(cell, fgColor),
          getBgColorString(cell),
          colorMap
        );
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
