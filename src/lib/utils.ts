export function unique<T>(arr: T[], fn: (el: T) => unknown) {
  const fnOfArr = arr.map(fn);
  return arr.filter((el, index) => fnOfArr.indexOf(fn(el)) === index);
}