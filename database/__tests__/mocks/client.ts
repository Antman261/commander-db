// deno-lint-ignore-file explicit-module-boundary-types explicit-function-return-type no-boolean-literal-for-arguments
import * as bytes from 'jsr:@std/bytes';
import { encodeVarint } from 'jsr:@std/encoding';
import { serialize } from 'node:v8';

type Message = Record<string, unknown>;
const MAX_LENGTH = 2 ** 32;

/**
 * Encodes a message in a binary representation.
 *
 * A message is made of two elements:

 * * 4 bytes representing the length of the data portion of the message in bytes, as an unsigned integer.
 * * The binary message data, encoded using v8.serialize
 *
 * This allows messages up to 4gb in length, much larger than any application could effectively use
 */
const encodeMessageToBinary = (msg: Message) => {
  const msgData = serialize(msg);
  if (msgData.byteLength > MAX_LENGTH) throw new RangeError('Maximum message length exceeded (4GB)');
  const lengthBlob = new Uint8Array(4);
  encodeVarint(msgData.byteLength, lengthBlob);
  const combined = bytes.concat([lengthBlob, msgData]);
  return combined;
};

export const startClient = async () => {
  const conn = await Deno.connect({
    hostname: '127.0.0.1',
    port: 8092,
    transport: 'tcp',
  });
  conn.setNoDelay(true);
  conn.setKeepAlive(true);
  const send = (msg: Message) => conn.write(encodeMessageToBinary(msg));
  conn.readable.pipeTo(Deno.stdout.writable);

  return {
    async requestCommandSubscription() {
      await send({ k: 'REQ_SUB' });
      console.log('Message sent');
    },
    async closeConnection() {
      await send({ k: 'EXIT' });
      await conn.closeWrite();
      conn.close();
      conn.unref();
    },
  };
};
