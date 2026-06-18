declare module "ngeohash" {
  export function encode(latitude: number, longitude: number, precision?: number): string;
  export function decode(geohash: string): { latitude: number; longitude: number };
  export function decode_bbox(geohash: string): [number, number, number, number];
}
