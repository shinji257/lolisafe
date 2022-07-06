const STRATEGIES = [
  'LAST_GET_TIME',
  'GETS_COUNT'
]

class SimpleDataStore {
  #store
  #size
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
    this.#size = this.#store.size
    this.#limit = options.limit
    this.#strategy = options.strategy
  }

  clear () {
    this.#store.clear()
    this.#size = 0
  }

  delete (key) {
    if (this.#store.delete(key)) {
      this.#size--
      return true
    }
    return false
  }

  deleteStalest () {
    const stalest = this.getStalest()
    if (stalest) {
      return this.delete(stalest)
    }
  }

  get (key) {
    const entry = this.#store.get(key)
    // This may return undefined or null
    // undefined should be an indicator for when the key legitimately has not been set,
    // null should be an indicator for when the key is still being held via hold() function
    if (!entry) return entry

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
    let stalest = [null, { stratval: Infinity }]
    switch (this.#strategy) {
      // both "lastGetTime" and "getsCount" simply must find lowest value
      // to determine the stalest entry
      case STRATEGIES[0]:
      case STRATEGIES[1]:
        for (const entry of this.#store) {
          if (entry[1] && entry[1].stratval < stalest[1].stratval) {
            stalest = entry
          }
        }
        break
    }

    // return its key only
    return stalest[0]
  }

  hold (key) {
    this.#store.set(key, null)
    return true
  }

  set (key, value) {
    if (this.#size >= this.#limit) {
      this.deleteStalest()
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

    if (this.#store.set(key, { value, stratval })) {
      this.#size++
      return true
    }
    return false
  }

  get limit () {
    return this.#limit
  }

  set limit (_) {
    throw Error('This property is read-only.')
  }

  get size () {
    return this.#size
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
module.exports.STRATEGIES = STRATEGIES
