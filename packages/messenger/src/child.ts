import {
  Message,
  MessengerConfig,
  ResponseMessage,
  MessageHandler,
} from './types';
import { DEFAULT_TARGET_ORIGIN, DEFAULT_TIMEOUT } from './constants';
import { MessagingError } from './errors';
import { ProviderRpcErrorCode } from 'viem';

export class ChildMessenger {
  private handlers: Map<string, MessageHandler> = new Map();
  private config: Required<MessengerConfig>;

  constructor(config: MessengerConfig = {}) {
    this.config = {
      targetOrigin: config.targetOrigin || DEFAULT_TARGET_ORIGIN,
      timeout: config.timeout || DEFAULT_TIMEOUT,
    };

    window.addEventListener('message', this.handleMessage);
  }

  public async sendResponse(
    id: string,
    result?: unknown,
    error?: ResponseMessage['error']
  ): Promise<void> {
    if (!window.opener) {
      throw new MessagingError('No parent window found');
    }

    const message: ResponseMessage = {
      type: 'response',
      id,
      method: 'response',
      result,
      error,
    };

    window.opener.postMessage(message, this.config.targetOrigin);
  }

  public on(method: string, handler: MessageHandler): void {
    this.handlers.set(method, handler);
  }

  public off(method: string): void {
    this.handlers.delete(method);
  }

  private handleMessage = async (
    event: MessageEvent<Message>
  ): Promise<void> => {
    const { data: message, origin } = event;

    if (
      this.config.targetOrigin !== '*' &&
      origin !== this.config.targetOrigin
    ) {
      return;
    }

    const handler = this.handlers.get(message.method);
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        if (message.type === 'request' && message.id) {
          await this.sendResponse(message.id, undefined, {
            code: -32603 as ProviderRpcErrorCode, // Internal error
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  };

  public destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.handlers.clear();
  }
}
