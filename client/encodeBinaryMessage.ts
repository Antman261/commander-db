import { type ClientMessage, UInt32 } from '@fe-db/proto';
import { serialize } from 'node:v8';

const MAX_LENGTH = 2 ** 32;
export const encodeBinaryMessage = (msg: ClientMessage) => {
  const msgData = serialize(msg);
  if (msgData.byteLength > MAX_LENGTH) throw new RangeError('Maximum message length exceeded (4GB)');
  const dataBuffer = new Uint8Array(msgData.byteLength + UInt32.bytes);
  dataBuffer.set(new UInt32(msgData.byteLength).toBinary());
  dataBuffer.set(msgData, UInt32.bytes);
  return dataBuffer;
  //   return new Uint8Array([
  //     ...new UInt(msgData.byteLength).toBinary().values(),
  //     ...msgData.values(),
  //   ]);
};
