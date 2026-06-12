export interface Point2 {
  x: number;
  y: number;
}

export interface ViewerStateSnapshot {
  windowCenter?: number;
  windowWidth?: number;
  zoom: number;
  pan: Point2;
  invert: boolean;
  toolMode: 'windowLevel' | 'pan' | 'zoom' | 'stackScroll';
}

export interface WindowLevel {
  center: number;
  width: number;
}
