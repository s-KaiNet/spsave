import {ILogger} from './ILogger';
import * as colors from 'colors';

export class ConsoleLogger implements ILogger {
  public error(message: string): void {
    this.log(message, 'red');
  }

  public warning(message: string): void {
    this.log(message, 'yellow');
  }

  public success(message: string): void {
    this.log(message, 'green');
  }

  public info(message: string): void {
    this.log(message, 'white');
  }

  private log(message: string, color: string): void {
    if (message === '') {
      console.log('');
    }
    console.log(colors[color](`spsave: ${message}`));
  }
}
