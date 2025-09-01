const bytes = new Uint8Array(16);
const view = new DataView(bytes.buffer);

export function generateUuidV7(timestamp: number = Date.now()): bigint {
  view.setBigUint64(0, BigInt(timestamp) << 16n);
  crypto.getRandomValues(bytes.subarray(6));
  const version = (view.getUint8(6) & 0b00001111) | 0b01110000;
  const variant = (view.getUint8(8) & 0b00111111) | 0b10000000;
  view.setUint8(6, version);
  view.setUint8(8, variant);
  const binaryString = '0b' + view.getBigUint64(0).toString(2) + view.getBigUint64(8).toString(2);
  return BigInt(binaryString);
}
