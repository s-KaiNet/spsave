export interface ILogger {
  error(message: string): void;
  warning(message: string): void;
  success(message: string): void;
  info(message: string): void;
}
