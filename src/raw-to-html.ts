import { ISelectionPosition, IBuffer, IBufferCell } from "xterm";

type PickElsePartial<T, K extends keyof T> = Partial<Exclude<T, K>> & {
  [P in K]: T[P];
};
type a = Pick<{ a: string; b: string }, "a" | "b">;
export interface RawToHtmlOptions {
  defBgColor: string;
  defFgColor: string;
  colorMap: Record<string, string>;
}

interface SpanOpen {
  openTag: string;
  closeTag: string;
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

const IS_HEX_REGEX = /^#[0-9a-fA-F]{1,}/;
type ColorMode = "DEFAULT" | "RGB" | "PALETTE";

const getColorFromColorCode = (
  colorCode: number,
  colorMode: ColorMode,
  bold: boolean,
  defaultColor: string | undefined
): string | undefined => {
  const effectiveColorCode = bold ? colorCode + 8 : colorCode;
  switch (colorMode) {
    case "DEFAULT":
      if (colorCode === -1 || colorCode >= colorList.length) {
        return defaultColor;
      }
      return colorList[effectiveColorCode];
    case "PALETTE":
      if (colorCode === -1 || colorCode >= colorList.length) {
        return undefined;
      }
      return colorList[effectiveColorCode];
    case "RGB":
      console.error("hyper-copy-as-html RGB color mode not supported.");
      return undefined;
    default:
      return undefined;
  }
};
const getFgColorString = (
  cell: IBufferCell,
  defaultFgColor: string,
  bold: boolean
): string | undefined => {
  const colorMode: ColorMode = cell.isFgDefault()
    ? "DEFAULT"
    : cell.isFgPalette()
    ? "PALETTE"
    : "RGB";
  return getColorFromColorCode(
    cell.getFgColor(),
    colorMode,
    bold,
    defaultFgColor
  );
};

const getBgColorString = (
  cell: IBufferCell,
  bold: boolean
): string | undefined => {
  const colorMode: ColorMode = cell.isBgDefault()
    ? "DEFAULT"
    : cell.isBgPalette()
    ? "PALETTE"
    : "RGB";
  return getColorFromColorCode(cell.getBgColor(), colorMode, bold, undefined);
};
const getSpanOpen = ({
  bgColor,
  fgColor,
  colorMap,
  bold,
  invert,
}: PickElsePartial<
  RawToHtmlOptions,
  "colorMap" | "defBgColor" | "defFgColor"
> & {
  bold: boolean;
  invert: boolean;
  bgColor: string | undefined;
  fgColor: string | undefined;
}): SpanOpen => {
  const result: SpanOpen = {
    openTag: "",
    closeTag: "",
  };

  if (bold) {
    result.openTag += "<b>";
    result.closeTag = "</b>" + result.closeTag;
  }

  let fgColorStr = fgColor
    ? IS_HEX_REGEX.test(fgColor)
      ? fgColor
      : colorMap[fgColor]
    : undefined;
  let bgColorStr = bgColor
    ? IS_HEX_REGEX.test(bgColor)
      ? bgColor
      : colorMap[bgColor]
    : undefined;

  if (invert) {
    const tmp = fgColorStr;
    fgColorStr = bgColorStr;
    bgColorStr = tmp;
  }
  if (bgColorStr && fgColorStr) {
    result.openTag += `<span style="color:${fgColorStr};background:${bgColorStr}">`;
  } else if (!bgColorStr && fgColorStr) {
    result.openTag += `<span style="color:${fgColorStr}">`;
  } else if (bgColorStr && !fgColorStr) {
    result.openTag += `<span style="background:${bgColorStr}">`;
  } else {
    result.openTag += "<span>";
  }
  result.closeTag = "</span>" + result.closeTag;
  return result;
};

const rawToHtml = (
  selectionPosition: ISelectionPosition,
  buffer: IBuffer,
  { defBgColor, defFgColor, colorMap }: RawToHtmlOptions
): string => {
  let result = `<pre style="background:${defBgColor}">\n`;
  let spanOpen: SpanOpen = {
    openTag: "<span>",
    closeTag: "</span>",
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
    let lastBold = undefined;
    let lastInverse = undefined;
    for (let col = firstCol; col < lastCol; col++) {
      const cell = line.getCell(col)!;

      // Should only go through this one time per line
      if (!lastFgColor && !lastBgColor && !lastBold && !lastInverse) {
        lastFgColor = cell.getFgColor();
        lastBgColor = cell.getBgColor();
        lastBold = cell.isBold() !== 0;
        lastInverse = cell.isInverse() !== 0;

        spanOpen = getSpanOpen({
          fgColor: getFgColorString(cell, defFgColor, lastBold),
          bgColor: getBgColorString(cell, lastBold),
          defFgColor,
          defBgColor,
          bold: lastBold,
          invert: lastInverse,
          colorMap,
        });
        result += spanOpen.openTag;
        result += cell.getChars() || " ";
      } else if (
        cell.getFgColor() !== lastFgColor ||
        cell.getBgColor() !== lastBgColor ||
        (cell.isBold() !== 0) !== lastBold ||
        (cell.isInverse() !== 0) !== lastInverse
      ) {
        result += spanOpen.closeTag;
        lastFgColor = cell.getFgColor();
        lastBgColor = cell.getBgColor();
        lastBold = cell.isBold() !== 0;
        lastInverse = cell.isInverse() !== 0;

        spanOpen = getSpanOpen({
          fgColor: getFgColorString(cell, defFgColor, lastBold),
          bgColor: getBgColorString(cell, lastBold),
          defFgColor,
          defBgColor,
          bold: lastBold,
          invert: lastInverse,
          colorMap,
        });
        result += spanOpen.openTag;
        result += cell.getChars() || " ";
      } else {
        result += cell.getChars() || " ";
      }
    }
    result += spanOpen.closeTag + "\n";
  }
  result += "</pre>";
  return result;
};

export { rawToHtml };
