import React_ from "react";
import { Terminal } from "xterm";
import { MenuItemConstructorOptions, Menu, clipboard } from "electron";

import { TermProps, Terms, Server } from "./src/hyper-types";
import { rawToHtml, RawToHtmlOptions } from "./src/raw-to-html";

const PLUGIN_NAME = "hyper-copy-as-html";
const PLUGIN_COPY_COMMAND = `${PLUGIN_NAME}:copy`;

/*
Main functionnality
*/
const copyAsHtml = (
  termInstance: Terminal | null,
  rawToHtmlOptions: RawToHtmlOptions
) => {
  // const termInstance = (global as PluginGlobal).hyperCopyAsHtml.termInstance;
  if (termInstance !== null) {
    const selectionPosition = termInstance.getSelectionPosition();
    if (selectionPosition !== undefined) {
      const buffer = termInstance.buffer.active;

      clipboard.writeText(
        rawToHtml(selectionPosition, buffer, rawToHtmlOptions)
      );
    }
  } else {
    console.warn(
      'No term instance registered in the plugin "hyper-copy-as-html".\nThis might be a bug.'
    );
  }
};

/*
Plugin exports
*/

// Adds a "Copy as HTML" option in the "Edit" menu
const decorateMenu = (
  menu: MenuItemConstructorOptions[]
): MenuItemConstructorOptions[] => {
  const editMenuIndex = menu.findIndex(
    (menuItem) => menuItem.label && menuItem.label === "Edit"
  );
  if (editMenuIndex === -1 || menu[editMenuIndex].submenu === undefined) {
    return menu;
  }
  const editSubmenu = menu[editMenuIndex]
    .submenu as MenuItemConstructorOptions[];

  const copyIndex = editSubmenu.findIndex(
    (menuItem) => menuItem.role && menuItem.role === "copy"
  );

  const editMenu: MenuItemConstructorOptions = {
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

// Add the command to the keymaps
const decorateKeymaps = (keymaps: Record<string, string>) => {
  const newKeymaps: Record<string, string> = {};
  newKeymaps[PLUGIN_COPY_COMMAND] = "ctrl+shift+h";
  return { ...keymaps, ...newKeymaps };
};

// Register copyAsHtml handlers (editMenu button click, shortcut usage)
const decorateTerms = (
  Terms: Terms & React_.Component<TermProps>,
  { React }: { React: typeof React_ }
) => {
  // Terms alike class
  return class extends React.Component<
    { onDecorated(terms: Terms): void } & TermProps
  > {
    terms: Terms | null;
    constructor(props: any, context: any) {
      super(props, context);
      this.terms = null;
      this.onDecorated = this.onDecorated.bind(this);
    }

    onDecorated(terms: Terms) {
      this.terms = terms;
      try {
        console.log(this.props.colors);
        this.props.backgroundColor;
        const commandResgistration: Record<
          string,
          (e: any, hyperDispatch: any) => void
        > = {};
        commandResgistration[PLUGIN_COPY_COMMAND] = (
          _e: any,
          _hyperDispatch: any
        ) => {
          copyAsHtml(this.terms?.getActiveTerm().term || null, {
            colorMap: this.props.colors,
            bgColor: this.props.backgroundColor,
            fgColor: this.props.foregroundColor,
          });
        };
        this.terms.registerCommands(commandResgistration);
      } catch {
        console.error(
          "hyper-copy-as-html: failed to add shortcut click listener."
        );
      }
      // Don't forget to propagate it to HOC chain
      if (this.props.onDecorated) this.props.onDecorated(terms);
    }
    componentDidMount() {
      const l_window = window as typeof window & { rpc?: Server };
      if (l_window.rpc) {
        l_window.rpc.on("command", (command: string) => {
          if (command === PLUGIN_COPY_COMMAND) {
            copyAsHtml(this.terms?.getActiveTerm().term || null, {
              colorMap: this.props.colors,
              bgColor: this.props.backgroundColor,
              fgColor: this.props.foregroundColor,
            });
          }
        });
      } else {
        console.error(
          "hyper-copy-as-html: failed to add menu button click listener."
        );
      }
    }

    render() {
      return React.createElement(
        // @ts-ignore
        Terms,
        Object.assign({}, this.props, {
          onDecorated: this.onDecorated,
        })
      );
    }
  };
};

export { decorateMenu, decorateTerms, decorateKeymaps };
