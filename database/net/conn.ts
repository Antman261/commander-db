import { concat, includesNeedle, indexOfNeedle } from "jsr:@std/bytes";
import { handleMessage } from "./msg.ts";

const NEW_LINE = Uint8Array.from([10]);

export async function handleConnection(conn: Deno.TcpConn) {
  let bigMessageBuffer = new Uint8Array(0);
  let isBigMessagePending = false;
  for await (const data of conn.readable) {
    const subMessages: Uint8Array[] = [];
    let remainingData = data.subarray(0);
    if (isBigMessagePending) {
      console.log("big message received");
      if (includesNeedle(data, NEW_LINE)) {
        const endOfMessageIndex = indexOfNeedle(data, NEW_LINE);
        subMessages.push(
          concat([
            bigMessageBuffer,
            data.subarray(0, endOfMessageIndex),
          ]),
        );
        bigMessageBuffer = new Uint8Array(0);
        isBigMessagePending = false;
        remainingData = data.subarray(endOfMessageIndex);
      }
    }
    while (remainingData.length) {
      if (includesNeedle(remainingData, NEW_LINE)) {
        const endOfMessageIndex = indexOfNeedle(data, NEW_LINE);
        subMessages.push(remainingData.subarray(0, endOfMessageIndex));
        remainingData = remainingData.subarray(endOfMessageIndex + 1);
      } else {
        isBigMessagePending = true;
        bigMessageBuffer.set(remainingData, bigMessageBuffer.length);
        remainingData = remainingData.subarray(remainingData.length);
      }
    }
    subMessages.forEach(handleMessage);
  }
}
