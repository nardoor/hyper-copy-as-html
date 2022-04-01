/*
The following types were copied or partially copied from the `hyper` repository.
They might not be correct as it gets updated.
*/

import React from "react";
import { BrowserWindow, WebContents } from "electron";
import { FontWeight, Terminal, ITerminalOptions, IDisposable } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { SearchAddon } from "xterm-addon-search";
import { Immutable } from "seamless-immutable";
import { ReactChild } from "react";
import EventEmitter from "events";

// hyper/app/rpc.ts - PARTIAL
// export class Server extends EventEmitter {
export type Server = EventEmitter & {
  destroyed: boolean;
  win: BrowserWindow;
  id: string;
  wc: WebContents;

  ipcListener(event: any, { ev, data }: { ev: string; data: any }): void;
  emit(ch: string, data: any): void;
  destroy(): void;
};

// hyper/app/extend-electron.ts
declare global {
  namespace Electron {
    interface App {
      // config: typeof import('./config');
      // plugins: typeof import('./plugins');
      getWindows: () => Set<BrowserWindow>;
      getLastFocusedWindow: () => BrowserWindow | null;
      windowCallback?: (win: BrowserWindow) => void;
      createWindow: (
        fn?: (win: BrowserWindow) => void,
        options?: { size?: [number, number]; position?: [number, number] }
      ) => BrowserWindow;
      setVersion: (version: string) => void;
    }

    interface BrowserWindow {
      uid: string;
      sessions: Map<any, any>;
      focusTime: number;
      clean: () => void;
      rpc: Server;
    }
  }
}

// hyper/lib/config.d.ts
type ColorMap = {
  black: string;
  blue: string;
  cyan: string;
  green: string;
  lightBlack: string;
  lightBlue: string;
  lightCyan: string;
  lightGreen: string;
  lightMagenta: string;
  lightRed: string;
  lightWhite: string;
  lightYellow: string;
  magenta: string;
  red: string;
  white: string;
  yellow: string;
};

// hyper/lib/hyper.d.ts
type cursorShapes = "BEAM" | "UNDERLINE" | "BLOCK";

// hyper/lib/hyper.d.ts
type extensionProps = Partial<{
  customChildren: ReactChild | ReactChild[];
  customChildrenBefore: ReactChild | ReactChild[];
  customCSS: string;
  customInnerChildren: ReactChild | ReactChild[];
}>;

// hyper/lib/hyper.d.ts
export type TermProps = {
  backgroundColor: string;
  bell: string;
  bellSound: string | null;
  bellSoundURL: string | null;
  borderColor: string;
  cleared: boolean;
  colors: ColorMap;
  cols: number | null;
  copyOnSelect: boolean;
  cursorAccentColor?: string;
  cursorBlink: boolean;
  cursorColor: string;
  cursorShape: cursorShapes;
  disableLigatures: boolean;
  fitAddon: FitAddon | null;
  fontFamily: string;
  fontSize: number;
  fontSmoothing?: string;
  fontWeight: FontWeight;
  fontWeightBold: FontWeight;
  foregroundColor: string;
  isTermActive: boolean;
  letterSpacing: number;
  lineHeight: number;
  macOptionSelectionMode: string;
  modifierKeys: Immutable<{ altIsMeta: boolean; cmdIsMeta: boolean }>;
  onActive: () => void;
  onCloseSearch: () => void;
  onContextMenu: (selection: any) => void;
  onCursorMove?: (cursorFrame: {
    x: number;
    y: number;
    width: number;
    height: number;
    col: number;
    row: number;
  }) => void;
  onData: (data: string) => void;
  onOpenSearch: () => void;
  onResize: (cols: number, rows: number) => void;
  onTitle: (title: string) => void;
  padding: string;
  quickEdit: boolean;
  rows: number | null;
  screenReaderMode: boolean;
  scrollback: number;
  search: boolean;
  searchAddon: SearchAddon | null;
  selectionColor: string;
  term: Terminal | null;
  uid: string;
  uiFontFamily: string;
  url: string | null;
  webGLRenderer: boolean;
  webLinksActivationKey: string;
  ref_: (uid: string, term: Term | null) => void;
} & extensionProps;

// hyper/lib/components/term.tsx - PARTIAL
// export default class Term extends React.PureComponent<TermProps> {
type Term = React.PureComponent<TermProps> & {
  termRef: HTMLElement | null;
  termWrapperRef: HTMLElement | null;
  termOptions: ITerminalOptions;
  disposableListeners: IDisposable[];
  termDefaultBellSound: string | null;
  fitAddon: FitAddon;
  searchAddon: SearchAddon;
  rendererTypes: Record<string, string>;
  term: Terminal;
  resizeObserver: ResizeObserver;
  resizeTimeout: NodeJS.Timeout;

  reportRenderer(uid: string, type: string): void;
  getTermDocument(): void;
  onWindowPaste: (e: Event) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  write(data: string | Uint8Array): void;
  focus(): void;
  clear(): void;
  reset(): void;
  search: (searchTerm: string) => void;
  searchNext: (searchTerm: string) => void;
  searchPrevious: (searchTerm: string) => void;
  closeSearchBox: () => void;
  resize(cols: number, rows: number): void;
  selectAll(): void;
  fitResize(): void;
  keyboardHandler(e: any): boolean;
  onTermWrapperRef: (component: HTMLElement | null) => void;
};

// hyper/lib/component/terms.tsx - PARTIAL
// export default class Terms extends React.Component<TermsProps> {
export type Terms = React.Component<TermProps> & {
  terms: Record<string, Term>;
  // registerCommands: (cmds: Record<string, (e: any, dispatch: HyperDispatch) => void>) => void;
  registerCommands: (
    cmds: Record<string, (e: any, dispatch: any) => void>
  ) => void;
  getTermByUid(uid: string): string;
  getActiveTerm(): Term;
  onTerminal(uid: string, term: Term): void;
};
