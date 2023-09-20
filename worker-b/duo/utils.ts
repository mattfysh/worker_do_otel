export function noimpl(msg: string) {
  return function () {
    throw new Error(`Not implemented: ${msg}`)
  }
}
