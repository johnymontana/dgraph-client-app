declare module 'react-sigma' {
  import { FC, ReactNode } from 'react';
  import Graph from 'graphology';

  interface SigmaContainerProps {
    graph: Graph;
    settings?: Record<string, any>;
    style?: React.CSSProperties;
    children?: ReactNode;
    onNodeClick?: (event: any, node: string) => void;
    onStageClick?: () => void;
  }

  interface ControlsContainerProps {
    position?: string;
    children?: ReactNode;
  }

  export const SigmaContainer: FC<SigmaContainerProps>;
  export const ControlsContainer: FC<ControlsContainerProps>;
  export const ZoomControl: FC;
  export const FullScreenControl: FC;
}
