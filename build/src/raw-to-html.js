"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawToHtml = void 0;
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
const getColorFromColorCode = (colorCode, colorMode, defaultColor) => {
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
const getFgColorString = (cell, defaultFgColor) => {
    const colorMode = cell.isFgDefault()
        ? "DEFAULT"
        : cell.isFgPalette()
            ? "PALETTE"
            : "RGB";
    return getColorFromColorCode(cell.getFgColor(), colorMode, defaultFgColor);
};
const getBgColorString = (cell) => {
    const colorMode = cell.isBgDefault()
        ? "DEFAULT"
        : cell.isBgPalette()
            ? "PALETTE"
            : "RGB";
    return getColorFromColorCode(cell.getBgColor(), colorMode, undefined);
};
const getSpanOpen = ({ bgColor, fgColor, colorMap, bold }) => {
    const result = {
        openTag: "",
        closeTag: ""
    };
    if (bold) {
        result.openTag += "<b>";
        result.closeTag = "</b>" + result.closeTag;
    }
    if (bgColor && fgColor) {
        const fgColorStr = IS_HEX_REGEX.test(fgColor) ? fgColor : colorMap[fgColor];
        const bgColorStr = IS_HEX_REGEX.test(bgColor) ? bgColor : colorMap[bgColor];
        result.openTag += `<span style="color:${fgColorStr};background:${bgColorStr}">`;
    }
    else if (!bgColor && fgColor) {
        const fgColorStr = IS_HEX_REGEX.test(fgColor) ? fgColor : colorMap[fgColor];
        result.openTag += `<span style="color:${fgColorStr}">`;
    }
    else if (bgColor && !fgColor) {
        const bgColorStr = IS_HEX_REGEX.test(bgColor) ? bgColor : colorMap[bgColor];
        result.openTag += `<span style="background:${bgColorStr}">`;
    }
    else {
        result.openTag += "<span>";
    }
    result.closeTag = "</span>" + result.closeTag;
    return result;
};
const rawToHtml = (selectionPosition, buffer, { bgColor, fgColor, colorMap }) => {
    let result = `<pre style="background:${bgColor}">`;
    let spanOpen = {
        openTag: "<span>",
        closeTag: "</span>"
    };
    for (let row = selectionPosition.startRow; row <= selectionPosition.endRow; row++) {
        const line = buffer.getLine(row);
        const firstCol = row === selectionPosition.startRow ? selectionPosition.startColumn : 0;
        const lastCol = row === selectionPosition.endRow
            ? selectionPosition.endColumn
            : line?.length;
        let lastFgColor = undefined;
        let lastBgColor = undefined;
        for (let col = firstCol; col < lastCol; col++) {
            const cell = line.getCell(col);
            // Should only go through this one time per line
            if (!lastFgColor && !lastBgColor) {
                lastFgColor = cell.getFgColor();
                lastBgColor = cell.getBgColor();
                spanOpen = getSpanOpen({
                    fgColor: getFgColorString(cell, fgColor),
                    bgColor: getBgColorString(cell),
                    bold: cell.isBold() !== 0,
                    colorMap
                });
                result += spanOpen.openTag;
                result += cell.getChars();
            }
            else if (cell.getFgColor() !== lastFgColor ||
                cell.getBgColor() !== lastBgColor) {
                result += spanOpen.closeTag;
                lastFgColor = cell.getFgColor();
                lastBgColor = cell.getBgColor();
                spanOpen = getSpanOpen({
                    fgColor: getFgColorString(cell, fgColor),
                    bgColor: getBgColorString(cell),
                    bold: cell.isBold() !== 0,
                    colorMap
                });
                result += spanOpen.openTag;
                result += cell.getChars();
            }
            else {
                result += cell.getChars();
            }
        }
        result += "</span>\n";
    }
    result += "</pre>";
    return result;
};
exports.rawToHtml = rawToHtml;
