const STRATEGIES = [
  'lastGetTime',
  'getsCount'
]

class SimpleDataStore {
  #store
  #limit
  #strategy

  constructor (options = {}) {
    if (typeof options !== 'object') {
      throw new TypeError('Missing options object.')
    }

    if (!Number.isFinite(options.limit) || options.limit <= 1) {
      throw new TypeError('Limit must be a finite number that is at least 2.')
    }

    if (!STRATEGIES.includes(options.strategy)) {
      throw new TypeError(`Strategy must be one of these: ${STRATEGIES.map(s => `"${s}"`).join(', ')}.`)
    }

    this.#store = new Map()
    this.#limit = options.limit
    this.#strategy = options.strategy
  }

  clear () {
    return this.#store.clear()
  }

  delete (key) {
    return this.#store.delete(key)
  }

  get (key) {
    const entry = this.#store.get(key)
    if (typeof entry === 'undefined') return entry

    switch (this.#strategy) {
      case STRATEGIES[0]:
        entry.stratval = Date.now()
        break
      case STRATEGIES[1]:
        entry.stratval++
        break
    }

    this.#store.set(key, entry)
    return entry.value
  }

  getStalest () {
    let stalest = null
    switch (this.#strategy) {
      // both "lastGetTime" and "getsCount" simply must find lowest value
      // to determine the stalest entry
      case STRATEGIES[0]:
      case STRATEGIES[1]:
        for (const entry of this.#store) {
          if (!stalest || entry[1].stratval < stalest[1].stratval) {
            stalest = entry
          }
        }
        break
    }

    // return its key only
    return stalest[0]
  }

  set (key, value) {
    if (this.#store.size >= this.#limit) {
      const stalest = this.getStalest()
      if (stalest) {
        this.#store.delete(stalest)
      }
    }

    let stratval
    switch (this.#strategy) {
      case STRATEGIES[0]:
        stratval = Date.now()
        break
      case STRATEGIES[1]:
        stratval = 0
        break
    }

    return this.#store.set(key, { value, stratval }) && true
  }

  get limit () {
    return this.#limit
  }

  set limit (_) {
    throw Error('This property is read-only.')
  }

  get size () {
    return this.#store.size
  }

  set size (_) {
    throw Error('This property is read-only.')
  }

  get strategy () {
    return this.#strategy
  }

  set strategy (_) {
    throw Error('This property is read-only.')
  }

  get store () {
    // return shallow copy
    return new Map(this.#store)
  }
}

module.exports = SimpleDataStore
