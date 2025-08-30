import { CommandMessage } from '../../protocol/msg/Command.ts';
import {
  commandAssigned,
  commandSubscriptionEnded,
  commandSubscriptionGranted,
  DbMessage,
} from '../../protocol/msg/DbMessage.ts';
import { Candidate } from './cmdSubManager.ts';

export class CommandSubscriber {
  id: Candidate['id'];
  #sendMsg: <M extends DbMessage>(cmd: M) => void;
  #whenDrained: PromiseWithResolvers<void>;
  #lastSeen: number;
  #firstSeen: number;
  #checkInInterval: number;

  allocated: number;
  maxConcurrency: number;
  commitHash?: string;
  isDraining: boolean;

  status: 'free' | 'saturated' | 'draining' | 'missing';
  get hasCapacity(): boolean {
    return this.allocated < this.maxConcurrency;
  }
  get isSaturated(): boolean {
    return this.allocated === this.maxConcurrency;
  }
  constructor(cfg: Candidate) {
    this.id = cfg.id;
    this.#sendMsg = cfg.sendMsg;
    this.maxConcurrency = cfg.maxConcurrentCmds;
    this.allocated = 0;
    this.isDraining = false;
    this.#whenDrained = Promise.withResolvers();
    this.#lastSeen = Date.now();
    this.#firstSeen = this.#lastSeen;
    this.status = 'free';
    this.#checkInInterval = setInterval(this.checkIn.bind(this), 10_000);
    this.#sendMsg(commandSubscriptionGranted());
  }

  #updateStatus() {
    this.#lastSeen = Date.now();
    if (this.status === 'draining' || this.status === 'missing') {
      if (this.allocated === 0) this.#whenDrained.resolve();
      return;
    }
    if (this.allocated < this.maxConcurrency) return this.status = 'free';
    if (this.allocated === this.maxConcurrency) return this.status = 'saturated';
  }
  checkIn(): void {
    const silentDurationMs = Date.now() - this.#lastSeen;
    if (silentDurationMs > 60_000) this.status = 'missing';
  }
  dispatchCommand(cmd: CommandMessage): void {
    this.allocated++;
    this.#updateStatus();
    this.#sendMsg(commandAssigned(cmd));
  }
  onCommandResult(): void {
    this.allocated--;
    this.#updateStatus();
  }
  async deregister(): Promise<void> {
    this.status = 'draining';
    // todo: draining timeout
    if (this.allocated > 0) await this.#whenDrained.promise;
    clearInterval(this.#checkInInterval);
    this.#sendMsg(commandSubscriptionEnded());
  }
}
