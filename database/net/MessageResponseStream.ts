import { journalWriter } from '@db/jnl';
import { isStrictlyNever } from '@antman/formic-utils';
import { cmdSubManager } from '@db/translation';
import {
  ClientMessage,
  clientMsg,
  commandIssued,
  DbMessage,
  DecodedMessageTuple,
  toClientMsgKind,
} from '@fe-db/proto';
import { setSpanAttributes, withTelemetry } from '@db/telemetry';

type Controller = TransformStreamDefaultController<DbMessage>;
type SendMessage = Controller['enqueue'];
type MessageTuple = DecodedMessageTuple<ClientMessage>;

type MessageHandler = (msgtuple: MessageTuple) => Promise<void>;
const defineMessageHandler = (controller: Controller, connId: string): MessageHandler => {
  const sendMsg: SendMessage = withTelemetry(
    controller.enqueue.bind(controller),
    'MessageResponseStream.sendMsg',
  );
  const closeStream = controller.terminate.bind(controller);
  return withTelemetry(async ([msg]) => {
    setSpanAttributes({ connId, 'msg.k': toClientMsgKind(msg.k) });
    try {
      console.log('Received message:', msg);
      switch (msg.k) {
        case clientMsg.requestCommandSubscription:
          setSpanAttributes({ 'msg.ags': msg.ags, 'msg.num': msg.num });
          cmdSubManager.registerCommandSubscriber({ id: connId, sendMsg, maxConcurrentCmds: msg.num });
          break;
        case clientMsg.endCommandSubscription:
          cmdSubManager.deregisterCommandSubscriber(connId);
          break;
        case clientMsg.issueCommand: {
          setSpanAttributes({ 'msg.id': msg.id?.toString() });
          const cmdId = await journalWriter.writeCommandIssued(msg, connId);
          setSpanAttributes({ cmdId: cmdId.toString() });
          sendMsg(commandIssued(cmdId));
          break;
        }
        case clientMsg.commandCompleted:
          // TODO
          setSpanAttributes({ 'msg.r': msg.r.toString() });
          cmdSubManager.onCommandResult(connId, msg.r, msg.cid);
          break;
        case clientMsg.requestEventSubscription:
          // TODO
          break;
        case clientMsg.endEventSubscription:
          // TODO
          break;
        case clientMsg.bye:
          closeStream();
          break;
        default:
          isStrictlyNever(msg);
          break;
      }
    } catch (err) {
      console.error(`Message processing error on ${connId}:`, err);
    }
  }, 'MessageResponseStream.onMessage');
};

export class MessageResponseStream extends TransformStream<DecodedMessageTuple<ClientMessage>, DbMessage> {
  constructor(id: string) {
    let handleMessage: MessageHandler;
    super({
      start(controller) {
        handleMessage = defineMessageHandler(controller, id);
      },
      async transform(msg) {
        await handleMessage(msg);
      },
    });
  }
}
