import { v4 as uuidv4 } from 'uuid';
import {
  Message,
  MessengerConfig,
  RequestMessage,
  ResponseMessage,
  MessageHandler,
} from './types';
import {
  DEFAULT_TARGET_ORIGIN,
  DEFAULT_TIMEOUT,
  POPUP_FEATURES,
} from './constants';
import { MessagingError, TimeoutError } from './errors';

export class ParentMessenger {
  private popup: Window | null = null;
  private handlers: Map<string, MessageHandler> = new Map();
  private pendingRequests: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();
  private config: Required<MessengerConfig>;

  constructor(config: MessengerConfig = {}) {
    this.config = {
      targetOrigin: config.targetOrigin || DEFAULT_TARGET_ORIGIN,
      timeout: config.timeout || DEFAULT_TIMEOUT,
    };

    window.addEventListener('message', this.handleMessage);
  }

  public async openPopup(url: string): Promise<void> {
    if (this.popup?.closed === false) {
      this.popup.focus();
      return;
    }

    this.popup = window.open(url, 'wallet_popup', POPUP_FEATURES);
    if (!this.popup) {
      throw new MessagingError('Failed to open popup');
    }
  }

  public closePopup(): void {
    this.popup?.close();
    this.popup = null;
  }

  public async request(method: string, params?: unknown[]) {
    if (!this.popup || this.popup.closed) {
      throw new MessagingError('Popup is not open');
    }

    const id = uuidv4();
    const message: RequestMessage = {
      type: 'request',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new TimeoutError(method));
      }, this.config.timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.popup!.postMessage(message, this.config.targetOrigin);
    });
  }

  public on(method: string, handler: MessageHandler): void {
    this.handlers.set(method, handler);
  }

  public off(method: string): void {
    this.handlers.delete(method);
  }

  private handleMessage = (event: MessageEvent<Message>): void => {
    const { data: message, origin } = event;

    if (
      this.config.targetOrigin !== '*' &&
      origin !== this.config.targetOrigin
    ) {
      return;
    }

    if (message.type === 'response' && message.id) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if ('error' in message) {
          pending.reject(new Error(message.error?.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else {
      const handler = this.handlers.get(message.method);
      if (handler) {
        handler(message)?.catch(console.error);
      }
    }
  };

  public destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.closePopup();
    this.pendingRequests.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingRequests.clear();
    this.handlers.clear();
  }
}
