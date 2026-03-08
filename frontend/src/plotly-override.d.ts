/**
 * Override react-plotly.js types to allow string template ('plotly_dark')
 * and string title values, which the strict @types don't permit but work at runtime.
 */
declare module 'react-plotly.js' {
  import * as React from 'react';

  interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    frames?: any[];
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    debug?: boolean;
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
    onPurge?: (figure: any, graphDiv: HTMLElement) => void;
    onError?: (err: Error) => void;
    onClick?: (event: any) => void;
    onHover?: (event: any) => void;
    onUnhover?: (event: any) => void;
    onSelected?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onRestyle?: (event: any) => void;
    divId?: string;
    revision?: number;
  }

  class Plot extends React.Component<PlotParams> {}
  export default Plot;
}
