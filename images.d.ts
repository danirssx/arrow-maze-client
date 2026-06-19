// Static image asset modules (Metro resolves these to an asset registration).
declare module "*.png" {
  const source: number;
  export default source;
}

declare module "*.jpg" {
  const source: number;
  export default source;
}
