import { instrumentDO } from './trace'

class Greet {
  fetch() {
    return new Response('hello from do')
  }
}

const InstrumentedGreet = instrumentDO(Greet)
export { InstrumentedGreet as Greet }
