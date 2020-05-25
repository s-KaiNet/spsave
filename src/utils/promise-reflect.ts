export function reflect<T>(promise: Promise<T>) {
  return promise
    .then(data => {
      return { data: data, isRejected: false, isResolved: true, reason: undefined }
    })
    .catch(error => {
      return { reason: error, isRejected: true, isResolved: false }
    });
}