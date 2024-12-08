const decoder = new TextDecoder();
export async function handleMessage(message: Uint8Array) {
  // mock implementation: todo replace
  console.log("received message:", decoder.decode(message));
}
