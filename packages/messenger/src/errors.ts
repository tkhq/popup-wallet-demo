export class MessagingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessagingError';
  }
}

export class TimeoutError extends MessagingError {
  constructor(method: string) {
    super(`Request timeout for method: ${method}`);
    this.name = 'TimeoutError';
  }
}
