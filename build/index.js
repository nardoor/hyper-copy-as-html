"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decorateKeymaps = exports.decorateTerms = exports.decorateMenu = void 0;
const electron_1 = require("electron");
const raw_to_html_1 = require("./src/raw-to-html");
const PLUGIN_NAME = "hyper-copy-as-html";
const PLUGIN_COPY_COMMAND = `${PLUGIN_NAME}:copy`;
/*
Main functionnality
*/
const copyAsHtml = (termInstance, rawToHtmlOptions) => {
    // const termInstance = (global as PluginGlobal).hyperCopyAsHtml.termInstance;
    if (termInstance !== null) {
        const selectionPosition = termInstance.getSelectionPosition();
        if (selectionPosition !== undefined) {
            const buffer = termInstance.buffer.active;
            electron_1.clipboard.writeText((0, raw_to_html_1.rawToHtml)(selectionPosition, buffer, rawToHtmlOptions));
        }
    }
    else {
        console.warn('No term instance registered in the plugin "hyper-copy-as-html".\nThis might be a bug.');
    }
};
/*
Plugin exports
*/
// Adds a "Copy as HTML" option in the "Edit" menu
const decorateMenu = (menu) => {
    const editMenuIndex = menu.findIndex((menuItem) => menuItem.label && menuItem.label === "Edit");
    if (editMenuIndex === -1 || menu[editMenuIndex].submenu === undefined) {
        return menu;
    }
    const editSubmenu = menu[editMenuIndex]
        .submenu;
    const copyIndex = editSubmenu.findIndex((menuItem) => menuItem.role && menuItem.role === "copy");
    const editMenu = {
        ...menu[editMenuIndex],
        // @ts-ignore
        submenu: [
            ...editSubmenu.slice(0, copyIndex + 1),
            {
                label: "Copy as HTML",
                accelerator: "ctrl+shift+h",
                click: (_menuItem, browserWindow, _event) => {
                    if (browserWindow) {
                        // Send event to the Renderer context
                        browserWindow.rpc.emit("command", PLUGIN_COPY_COMMAND);
                    }
                },
            },
            ...editSubmenu.slice(copyIndex + 1),
        ],
    };
    return [
        ...menu.slice(0, editMenuIndex),
        editMenu,
        ...menu.slice(editMenuIndex + 1),
    ];
};
exports.decorateMenu = decorateMenu;
// Add the command to the keymaps
const decorateKeymaps = (keymaps) => {
    const newKeymaps = {};
    newKeymaps[PLUGIN_COPY_COMMAND] = "ctrl+shift+h";
    return { ...keymaps, ...newKeymaps };
};
exports.decorateKeymaps = decorateKeymaps;
// Register copyAsHtml handlers (editMenu button click, shortcut usage)
const decorateTerms = (Terms, { React }) => {
    // Terms alike class
    return class extends React.Component {
        constructor(props, context) {
            super(props, context);
            this.terms = null;
            this.onDecorated = this.onDecorated.bind(this);
        }
        onDecorated(terms) {
            this.terms = terms;
            try {
                console.log(this.props.colors);
                this.props.backgroundColor;
                const commandResgistration = {};
                commandResgistration[PLUGIN_COPY_COMMAND] = (_e, _hyperDispatch) => {
                    copyAsHtml(this.terms?.getActiveTerm().term || null, {
                        colorMap: this.props.colors,
                        bgColor: this.props.backgroundColor,
                        fgColor: this.props.foregroundColor,
                    });
                };
                this.terms.registerCommands(commandResgistration);
            }
            catch {
                console.error("hyper-copy-as-html: failed to add shortcut click listener.");
            }
            // Don't forget to propagate it to HOC chain
            if (this.props.onDecorated)
                this.props.onDecorated(terms);
        }
        componentDidMount() {
            const l_window = window;
            if (l_window.rpc) {
                l_window.rpc.on("command", (command) => {
                    if (command === PLUGIN_COPY_COMMAND) {
                        copyAsHtml(this.terms?.getActiveTerm().term || null, {
                            colorMap: this.props.colors,
                            bgColor: this.props.backgroundColor,
                            fgColor: this.props.foregroundColor,
                        });
                    }
                });
            }
            else {
                console.error("hyper-copy-as-html: failed to add menu button click listener.");
            }
        }
        render() {
            return React.createElement(
            // @ts-ignore
            Terms, Object.assign({}, this.props, {
                onDecorated: this.onDecorated,
            }));
        }
    };
};
exports.decorateTerms = decorateTerms;
