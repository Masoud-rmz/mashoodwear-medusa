/**
 * Wrap async Express handlers so rejections reach the error middleware
 * instead of crashing the Node process.
 * @param {import("express").RequestHandler} handler
 * @returns {import("express").RequestHandler}
 */
export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
