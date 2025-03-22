export type ClientMessage = {
  k: string; // todo: replace with discriminated union
};

export async function handleMessage(msg: ClientMessage): Promise<ClientMessage> {
  // mock implementation: todo replace
  console.log('received message:', msg);
  if (msg.k === 'REQ_SUB') {
    return { k: 'ACK_SUB' };
  }
  return { k: 'ACK' };
}
