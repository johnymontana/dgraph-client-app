declare module '@mapbox/mapbox-gl-draw' {
  import { IControl } from 'maplibre-gl';

  interface MapboxDrawOptions {
    displayControlsDefault?: boolean;
    controls?: {
      polygon?: boolean;
      point?: boolean;
      line?: boolean;
      trash?: boolean;
    };
    styles?: Array<{
      id: string;
      type: string;
      filter?: any[];
      layout?: any;
      paint?: any;
    }>;
  }

  class MapboxDraw implements IControl {
    constructor(options?: MapboxDrawOptions);
    onAdd(map: any): HTMLElement;
    onRemove(map: any): void;
    deleteAll(): void;
    on(event: string, listener: (e: any) => void): void;
    off(event: string, listener: (e: any) => void): void;
    changeMode(mode: string): void;
    getAll(): any;
    getSelected(): any;
    getSelectedIds(): string[];
    set(features: any): void;
    add(features: any): void;
    remove(features: any): void;
    trash(): void;
  }

  export = MapboxDraw;
}
