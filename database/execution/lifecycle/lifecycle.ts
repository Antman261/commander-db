import { EventEmitter } from 'node:events';

export type ComponentStatus = 'pending' | 'running' | 'crashed';
type Opt = { healthCheckIntervalMs: number };
type Options = Partial<Opt>;
type Status = 'pending' | 'starting' | 'running' | 'closing' | 'closed';

export type Component = {
  name: string;
  start(): Promise<unknown>;
  restart?(): Promise<unknown>;
  getStatus(): Promise<ComponentStatus>;
  close(): Promise<unknown>;
};

const defaultOptions = { healthCheckIntervalMs: 600 };

export class Lifecycle extends EventEmitter {
  #status: Status;
  #components: Component[];
  #healthCheckInterval: number;
  #setStatus(v: Status): void {
    this.#status = v;
    this.emit(v);
  }
  constructor(opt: Options = defaultOptions) {
    super();
    const { healthCheckIntervalMs } = { ...defaultOptions, ...opt };
    this.#status = 'pending';
    this.#components = [];
    Deno.addSignalListener('SIGTERM', this.close);
    const runHealthCheck = () => this.#checkComponentHealth();
    this.#healthCheckInterval = setInterval(runHealthCheck, healthCheckIntervalMs);
  }

  public register(component: Component): void {
    if (this.#status !== 'pending') throw new Error('Cannot register components after lifecycle started');
    this.#components.push(component);
  }
  public async start(): Promise<void> {
    this.#setStatus('starting');
    for (const component of this.#components) {
      await this.startComponent(component);
    }
    this.#setStatus('running');
  }

  public async close(): Promise<void> {
    if (this.#status === 'closing') return new Promise((resolve) => this.on('closed', resolve));
    if (this.#status !== 'running') throw new Error(`Tried to close lifecycle with status ${this.#status}`);

    Deno.removeSignalListener('SIGTERM', this.close);
    clearInterval(this.#healthCheckInterval);
    this.#setStatus('closing');

    const components = this.#components.toReversed();

    for (const component of components) await this.#closeComponent(component);

    this.#setStatus('closed');
  }
  private async startComponent(component: Component): Promise<void> {
    await component.start();
    this.emit('componentStarted', component.name);
  }
  async #closeComponent(component: Component): Promise<void> {
    this.emit('componentClosing', component.name);
    await component.close();
    this.emit('componentClosed', component.name);
  }
  private async restartComponent(component: Component): Promise<void> {
    this.emit('componentRestarting', component.name);
    await ((component.restart ?? component.start)());
    this.emit('componentRestarted', component.name);
  }
  async #checkComponentHealth(): Promise<void> {
    for (const component of this.#components) {
      if (await hasCrashed(component)) await this.restartComponent(component);
    }
    this.emit('healthChecked');
  }
}

const hasStatus = (status: ComponentStatus) => async (component: Component): Promise<boolean> =>
  await component.getStatus() === status;

const hasCrashed = hasStatus('crashed');
