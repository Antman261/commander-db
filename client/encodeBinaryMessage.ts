import { UInt } from '@fe-db/proto';
import { serialize } from 'node:v8';
import type { Message } from './commonTypes.ts';

const MAX_LENGTH = 2 ** 32;
export const encodeBinaryMessage = (msg: Message) => {
  const msgData = serialize(msg);
  if (msgData.byteLength > MAX_LENGTH) throw new RangeError('Maximum message length exceeded (4GB)');
  const dataBuffer = new Uint8Array(msgData.byteLength + UInt.bytes);
  dataBuffer.set(msgData, UInt.bytes);
  return dataBuffer;
  //   return new Uint8Array([
  //     ...new UInt(msgData.byteLength).toBinary().values(),
  //     ...msgData.values(),
  //   ]);
};
