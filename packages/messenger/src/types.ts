import { ProviderRpcErrorCode } from 'viem';

export type MessageType = 'request' | 'response' | 'notification';

export interface BaseMessage {
  type: MessageType;
  id?: string;
  method: string;
}

export interface RequestMessage extends BaseMessage {
  type: 'request';
  params?: unknown[];
}

export interface ResponseMessage extends BaseMessage {
  type: 'response';
  result?: unknown;
  error?: {
    code: ProviderRpcErrorCode;
    message: string;
    data?: unknown;
  };
}

export interface NotificationMessage extends BaseMessage {
  type: 'notification';
  data?: unknown;
}

export type Message = RequestMessage | ResponseMessage | NotificationMessage;

export interface MessengerConfig {
  targetOrigin?: string;
  timeout?: number;
}

export interface MessageHandler {
  (message: Message): void | Promise<void>;
}
