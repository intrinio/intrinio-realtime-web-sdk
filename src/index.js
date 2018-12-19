'use strict'

const TOKEN_EXPIRATION_INTERVAL = 1000 * 60 * 60 * 24 * 7 // 1 week
const HEARTBEAT_INTERVAL = 1000 * 20 // 20 seconds
const SELF_HEAL_BACKOFFS = [0,100,500,1000,2000,5000]
const WS_CLOSE_REASON_USER = 1000
const IEX = "iex"
const CRYPTOQUOTE = "cryptoquote"
const FXCM = "fxcm"
const PROVIDERS = [IEX, CRYPTOQUOTE, FXCM]

class IntrinioRealtime {
  constructor(options) {
    this.options = options
    this.token = null
    this.websocket = null
    this.channels = {}
    this.afterConnected = null // Promise
    this.self_heal_backoff = SELF_HEAL_BACKOFFS.slice()
    this.self_heal_ref = null
    this.quote_callback = null
    this.error_callback = null

    // Parse options
    if (!options) {
      this._throw("Need a valid options parameter")
    }

    if (!options.public_key) {
      this._throw("Need a valid public_key")
    }

    if (!PROVIDERS.includes(options.provider)) {
      this._throw("Need a valid provider")
    }

    // Establish connection
    this._connect()

    // Refresh token every week
    this.token_expiration_ref = setInterval(() => {
      this._connect()
    }, TOKEN_EXPIRATION_INTERVAL)

    // Send heartbeat at intervals
    this.heartbeat_ref = setInterval(()=> {
      this._heartbeat()
    }, HEARTBEAT_INTERVAL)
  }

  _log(...parts) {
    var message = "IntrinioRealtime | "
    parts.forEach(part => {
      if (typeof part === 'object') { part = JSON.stringify(part) }
      message += part
    })
    console.log(message)
  }

  _debug(...parts) {
    if (this.options.debug) {
      this._log(...parts)
    }
  }

  _throw(e) {
    let handled = false
    if (typeof e === 'string') {
      e = "IntrinioRealtime | " + e
    }
    if (typeof this.error_callback === 'function') {
      this.error_callback(e)
      handled = true
    }
    if (!handled) {
      throw e
    }
  }

  _connect(rejoin=false) {
    this._debug("Connecting...")

    this.afterConnected = new Promise((fulfill, reject) => {
      this._refreshToken().then(() => {
        this._refreshWebsocket().then(() => {
          fulfill()
        }, reject)
      }, reject)
    })

    this.afterConnected.then(() => {
      this._stopSelfHeal()
      if (rejoin) { this._rejoinChannels() }
    },
    () => {
      this._trySelfHeal()
    })

    return this.afterConnected
  }

  _refreshToken() {
    this._debug("Requesting auth token...")

    return new Promise((fulfill, reject) => {
      var { public_key, provider } = this.options

      // Get token
      var url = ""
      if (provider == "iex") {
        url = "https://realtime.intrinio.com/auth"
      }
      else if (provider == "cryptoquote") {
        url = "https://crypto.intrinio.com/auth"
      }
      else if (provider == "fxcm") {
        url = "https://fxcm.intrinio.com/auth"
      }

      var xmlhttp = new XMLHttpRequest()
      xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4) {
          if (xmlhttp.status == 401) {
            this._throw("Unable to authorize")
            reject()
          } else if (xmlhttp.status != 200) {
            console.error("IntrinioRealtime | Could not get auth token: Status code " + xmlhttp.status)
            console.error(xmlhttp)
            reject()
          } else {
            this.token = xmlhttp.responseText
            this._debug("Received auth token!")
            fulfill()
          }
        }
      }
      xmlhttp.open("GET", url, true)
      xmlhttp.setRequestHeader('Content-Type', 'application/json')
      xmlhttp.setRequestHeader('Authorization', 'Public ' + public_key)
      xmlhttp.send()
    })
  }

  _refreshWebsocket() {
    this._debug("Establishing websocket...")

    return new Promise((fulfill, reject) => {
      if (this.websocket) {
        this.websocket.close(WS_CLOSE_REASON_USER, "User terminated")
      }
      
      var socket_url = ""

      if (this.options.provider == "iex") {
        socket_url = "wss://realtime.intrinio.com/socket/websocket?vsn=1.0.0&token=" + encodeURIComponent(this.token)
      }
      else if (this.options.provider == "cryptoquote") {
        socket_url = "wss://crypto.intrinio.com/socket/websocket?vsn=1.0.0&token=" + encodeURIComponent(this.token)
      }
      else if (this.options.provider == "fxcm") {
        socket_url = "wss://fxcm.intrinio.com/socket/websocket?vsn=1.0.0&token=" + encodeURIComponent(this.token)
      }

      this.websocket = new WebSocket(socket_url)

      this.websocket.onopen = () => {
        this._debug("Websocket connected!")
        fulfill()
      }

      this.websocket.onclose = (code, reason) => {
        this._debug("Websocket closed!")
        if (code != WS_CLOSE_REASON_USER) {
          this._trySelfHeal()
        }
      }

      this.websocket.onerror = e => {
        console.error("IntrinioRealtime | Websocket error: " + e + "\n" + e.stack.split("\n"))
        reject(e)
      }
      
      this.websocket.onmessage = (event) => {
        var message = JSON.parse(event.data)
        var quote = null
        
        if (this.options.provider == "iex") {
          if (message["event"] === 'quote') {
            quote = message["payload"]
          }
        }
        else if (this.options.provider == "cryptoquote") {
          if (message["event"] === 'book_update' || message["event"] === 'ticker' || message["event"] === 'trade') {
            quote = message["payload"]
          }
        }
        else if (this.options.provider == "fxcm") {
          if (message["event"] === 'price_update') {
            quote = message["payload"]
          }
        }

        if (quote) {
          if (typeof this.quote_callback === 'function') {
            this.quote_callback(quote)
          }
          this._debug('Quote: ', quote)
        }
        else {
          this._debug('Non-quote message: ', event)
        }
      }
    })
  }

  _trySelfHeal() {
    this._log("No connection! Retrying...")

    var time = this.self_heal_backoff[0]
    if (this.self_heal_backoff.length > 1) {
      time = this.self_heal_backoff.shift()
    }

    if (this.self_heal_ref) { clearTimeout(this.self_heal_ref) }

    this.self_heal_ref = setTimeout(() => {
      this._connect(true)
    }, time)
  }

  _stopSelfHeal() {
    this.self_heal_backoff = Array.from(SELF_HEAL_BACKOFFS)

    if (this.self_heal_ref) {
      clearTimeout(this.self_heal_ref)
      this.self_heal_ref = null
    }
  }

  _rejoinChannels() {
    for (var channel in this.channels) {
      var msg = this._generateJoinMessage(channel)
      this.websocket.send(JSON.stringify(msg))

      this._debug('Rejoined channel: ', channel)
    }
  }

  _heartbeat() {
    this.afterConnected.then(() => {
      if (this.options.provider == "iex" || this.options.provider == "cryptoquote" || this.options.provider == "fxcm") {
        this.websocket.send(JSON.stringify({
          topic: 'phoenix',
          event: 'heartbeat',
          payload: {},
          ref: null
        }))
      }
    })
  }

  _parseChannels(args) {
    var channels = []

    args.forEach(arg => {
      if (Array.isArray(arg)) {
        arg.forEach(sub_arg => {
          if (typeof sub_arg === 'string') {
            channels.push(sub_arg.trim())
          }
          else {
            this._throw("Invalid channel provided")
          }
        })
      }
      else if (typeof arg === 'string') {
        channels.push(arg.trim())
      }
      else {
        this._throw("Invalid channel provided")
      }
    })

    channels.forEach(channel => {
      if (channel.length == 0) {
        this._throw("Invalid channel provided")
      }
    })

    return channels
  }
  
  _parseIexTopic(channel) {
    var topic = null
    if (channel == "$lobby") {
      topic = "iex:lobby"
    }
    else if (channel == "$lobby_last_price") {
      topic = "iex:lobby:last_price"
    }
    else {
      topic = "iex:securities:" + channel
    }
    return topic
  }

  _generateJoinMessage(channel) {
    if (this.options.provider == "iex") {
      return {
        topic: this._parseIexTopic(channel),
        event: 'phx_join',
        payload: {},
        ref: null
      }
    }
    else if (this.options.provider == "cryptoquote") {
      return {
        topic: channel,
        event: 'phx_join',
        payload: {},
        ref: null
      }
    }
    else if (this.options.provider == "fxcm") {
      return {
        topic: channel,
        event: 'phx_join',
        payload: {},
        ref: null
      }
    }
  }
  
  _generateLeaveMessage(channel) {
    if (this.options.provider == "iex") {
      return {
        topic: this._parseIexTopic(channel),
        event: 'phx_leave',
        payload: {},
        ref: null
      }
    }
    else if (this.options.provider == "cryptoquote") {
      return {
        topic: channel,
        event: 'phx_leave',
        payload: {},
        ref: null
      }
    }
    else if (this.options.provider == "fxcm") {
      return {
        topic: channel,
        event: 'phx_leave',
        payload: {},
        ref: null
      }
    }
  }

  destroy() {
    if (this.token_expiration_ref) {
      clearInterval(this.token_expiration_ref)
    }

    if (this.heartbeat_ref) {
      clearInterval(this.heartbeat_ref)
    }

    if (this.self_heal_ref) {
      clearTimeout(this.self_heal_ref)
    }

    if (this.websocket) {
      this.websocket.close(WS_CLOSE_REASON_USER, "User terminated")
    }
  }

  onError(callback) {
    this.error_callback = callback
  }

  onQuote(callback) {
    this.quote_callback = callback
  }

  join(...channels) {
    var channels = this._parseChannels(channels)

    return this.afterConnected.then(() => {
      channels.forEach(channel => {
        this.channels[channel] = true
        
        var msg = this._generateJoinMessage(channel)
        this.websocket.send(JSON.stringify(msg))

        this._debug('Joined channel: ', channel)
      })
    })
  }

  leave(...channels) {
    var channels = this._parseChannels(channels)

    return this.afterConnected.then(() => {
      channels.forEach(channel => {
        delete this.channels[channel]

        var msg = this._generateLeaveMessage(channel)
        this.websocket.send(JSON.stringify(msg))

        this._debug('Left channel: ', channel)
      })
    })
  }

  leaveAll() {
    return this.afterConnected.then(() => {
      for (var channel in this.channels) {
        delete this.channels[channel]

        var msg = this._generateLeaveMessage(channel)
        this.websocket.send(JSON.stringify(msg))

        this._debug('Left channel: ', channel)
      }
    })
  }

  listConnectedChannels() {
    var channels = []
    for (var channel in this.channels) {
      channels.push(channel)
    }
    return channels
  }
}

window.IntrinioRealtime = IntrinioRealtime
