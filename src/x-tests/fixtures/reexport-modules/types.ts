export interface Config {
  enabled: boolean;
  name: string;
}

export type Status = 'pending' | 'complete';

export default interface DefaultConfig {
  timeout: number;
}