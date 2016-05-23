import {ILogger} from './ILogger';
import * as colors from 'colors';
import * as util from 'util';

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
      return;
    }
    let dateNow: Date = new Date();
    let dateString: string = util.format('[%s:%s:%s]',
      ('0' + dateNow.getHours()).slice(-2), ('0' + dateNow.getMinutes()).slice(-2), ('0' + dateNow.getSeconds()).slice(-2));
    console.log(colors[color](`${dateString} spsave: ${message}`));
  }
}
