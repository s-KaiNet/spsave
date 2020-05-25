export interface IDeferred<T> {
  resolve: (result: T) => void;
  reject: (err: T) => void;
  promise: Promise<T>;
  isPending(): boolean;
}

export function defer<T>(): IDeferred<T> {
  let isPending = true;
  let resolve: (result: T) => void;
  let reject: (err: T) => void;
  let promise: Promise<T> = new Promise<T>((rs, rj): void => {
    resolve = (result) => {
      isPending = false;
      rs(result);
    }
    reject = (error) => {
      isPending = false;
      rj(error);
    }
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise,
    isPending() {
      return isPending;
    }
  };
}
