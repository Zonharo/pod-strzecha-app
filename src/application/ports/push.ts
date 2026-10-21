export type PushStatus = 'enabled' | 'denied' | 'undetermined' | 'unavailable';

export type PushRegistrar = {
  status(): Promise<PushStatus>;
  enable(ask: boolean): Promise<PushStatus>;
};
