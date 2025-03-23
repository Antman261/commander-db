export type ClientMessage = {
  k: string; // todo: replace with discriminated union
  [key: string]: unknown;
};

let counter = 0;
export async function handleMessage(msg: ClientMessage): Promise<ClientMessage> {
  // mock implementation: todo replace
  console.log('db:received message', counter++, msg);
  if (msg.k === 'REQ_SUB') {
    return { k: 'ACK_SUB' };
  }
  if (msg.k === 'UNSUB') {
    return { k: 'UNSUB_ACK' };
  }
  return { k: 'ACK' };
}
