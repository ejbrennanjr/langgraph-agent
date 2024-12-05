export interface UserInterface {
  id: string;
  name: string;
}

export type Status = 'active' | 'inactive';

export default interface DefaultInterface {
  config: string;
}