import { journalWriter } from '@db/jnl';
import { isStrictlyNever } from '@antman/formic-utils';
import { cmdSubManager } from '@db/translation';
import { ClientMessage, clientMsg, commandIssued, DbMessage, DecodedMessageTuple } from '@fe-db/proto';
import { CommandPending } from '@db/type';

export class MessageResponseStream extends TransformStream<DecodedMessageTuple<ClientMessage>, DbMessage> {
  constructor(id: string) {
    super({
      start() {},
      async transform([msg], controller) {
        const sendMsg = controller.enqueue.bind(controller);
        let activeCommandId: CommandPending['id'];
        try {
          console.log('Received message:', msg);
          switch (msg.k) {
            case clientMsg.requestCommandSubscription:
              cmdSubManager.registerCommandSubscriber({ id, sendMsg, maxConcurrentCmds: msg.num });
              break;
            case clientMsg.endCommandSubscription:
              cmdSubManager.deregisterCommandSubscriber(id);
              break;
            case clientMsg.issueCommand: {
              const cmdId = await journalWriter.writeCommandIssued(msg, id);
              sendMsg(commandIssued(cmdId));
              break;
            }
            case clientMsg.commandCompleted:
              // TODO
              journalWriter.writeCommandOutcome(msg.result);
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
