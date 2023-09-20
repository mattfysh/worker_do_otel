Promise.withResolvers ??= function <T>() {
  let res, rej
  const promise = new Promise<T>((resolve, reject) => {
    res = resolve
    rej = reject
  })

  return { promise, resolve: res!, reject: rej! }
}
