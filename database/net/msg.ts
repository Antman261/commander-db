export type ClientMessage = {
  kind: string; // todo: replace with discriminated union
};

export async function handleMessage(message: ClientMessage): Promise<void> {
  // mock implementation: todo replace
  console.log('received message:', message);
}
