// import { instrumentDO } from './trace'

class Counter implements DurableObject {
  // private state: DurableObjectState

  constructor(state: DurableObjectState) {
    // this.state = state
  }

  fetch(request: Request) {
    let url = new URL(request.url)

    let value = 0
    // let value: number = (await this.state.storage.get('value')) || 0
    switch (url.pathname) {
      case '/increment':
        ++value
        break
      case '/decrement':
        --value
        break
      case '/':
        // Just serve the current value. No storage calls needed!
        break
      default:
        return new Response('Not found', { status: 404 })
    }

    // await this.state.storage.put('value', value)

    return new Response(value.toString())
  }
}

export { Counter }
// const InstrumentedCounter = instrumentDO(Counter)
// export { InstrumentedCounter as Counter }
