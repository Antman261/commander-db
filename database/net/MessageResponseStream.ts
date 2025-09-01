import { journalWriter } from '@db/jnl';
import { isStrictlyNever } from '@antman/formic-utils';
import { cmdSubManager } from '@db/translation';
import { ClientMessage, clientMsg, DbMessage } from '@fe-db/proto';

export class MessageResponseStream extends TransformStream<ClientMessage, DbMessage> {
  constructor(id: string) {
    super({
      start() {},
      transform(msg, controller) {
        const sendMsg = controller.enqueue.bind(controller);
        try {
          console.log('Received message:', msg);
          switch (msg.k) {
            case clientMsg.requestCommandSubscription:
              cmdSubManager.registerCommandSubscriber({ id, sendMsg, maxConcurrentCmds: msg.num });
              break;
            case clientMsg.endCommandSubscription:
              cmdSubManager.deregisterCommandSubscriber(id);
              break;
            case clientMsg.issueCommand:
              // TODO
              journalWriter.writeCommand(msg);
              break;
            case clientMsg.commandCompleted:
              // TODO
              cmdSubManager.onCommandResult(id);
              break;
            case clientMsg.requestEventSubscription:
              // TODO
              break;
            case clientMsg.endEventSubscription:
              // TODO
              break;
            case clientMsg.bye:
              controller.terminate();
              break;
            default:
              isStrictlyNever(msg);
              break;
          }
        } catch (err) {
          console.error('Message processing error:', err);
        }
      },
    });
  }
}
