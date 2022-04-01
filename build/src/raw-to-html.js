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
const getSpanOpen = (fgColor, bgColor) => {
    if (!fgColor && !bgColor) {
        return "<span>";
    }
    else if (!bgColor && fgColor) {
        return `<span style="color:${fgColor}">`;
    }
    else if (bgColor && !fgColor) {
        return `<span style="background:${bgColor}">`;
    }
    return `<span style="color:${fgColor};background:${bgColor}">`;
};
const rawToHtml = (selectionPosition, buffer, { bgColor, fgColor }) => {
    let result = `<pre style="background:${bgColor}">`;
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
                result += getSpanOpen(getFgColorString(cell, fgColor), getBgColorString(cell));
                result += cell.getChars();
            }
            else if (cell.getFgColor() !== lastFgColor ||
                cell.getBgColor() !== lastBgColor) {
                result += "</span>";
                lastFgColor = cell.getFgColor();
                lastBgColor = cell.getBgColor();
                result += getSpanOpen(getFgColorString(cell, fgColor), getBgColorString(cell));
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
