import { HTTPError } from 'sp-request';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function reflect<T>(promise: Promise<T>): Promise<{ isRejected: boolean, isResolved: boolean, reason: HTTPError, data: T }> {
  return promise
    .then(data => {
      return { data: data, isRejected: false, isResolved: true, reason: undefined }
    })
    .catch((error: HTTPError) => {
      return { reason: error, isRejected: true, isResolved: false, data: undefined }
    });
}