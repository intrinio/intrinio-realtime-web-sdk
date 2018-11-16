# Intrinio Web SDK for Real-Time Stock Prices

[Intrinio](https://intrinio.com/) provides real-time stock prices via a two-way WebSocket connection.

## Features

* Receive streaming, real-time price quotes (last trade, bid, ask)
* Subscribe to updates from individual securities
* Subscribe to updates for all securities (contact us for special access)

## Script
To use the SDK, include the script (found in `/dist` folder of this repository) at the end of your `<body>` tag.

```html
<script src='intrinio-realtime.js' type='text/javascript'></script>
```

## Example Usage
```javascript
// Create an IntrinioRealtime instance
var ir = new IntrinioRealtime({
  api_key: "YOUR_INTRINIO_API_KEY",
  provider: "iex"
})

// Listen for quotes
ir.onQuote(function(quote) {
  console.log(quote)
})

// Join channels
ir.join("AAPL","GE","MSFT")
```

For another example, see the `/sample` folder. Make sure to substitute your own API Key.

## API Key
You will receive your Intrinio API Key after [creating an account](https://intrinio.com/signup). The key will appear on your Account page, which you will need for to use the SDK. You will also need a subscription to a [real-time data feed](https://intrinio.com/marketplace/data/prices/realtime) for one of the providers listed below.

## Public Access Key
You can create a Public Access Key after [creating an account](https://intrinio.com/signup). On your Account page, scroll down to Access Keys, click Add New Key, name it, and specify Public. The key will appear on your Account page, which you will need for to use the SDK. You will also need a subscription to a [real-time data feed](https://intrinio.com/marketplace/data/prices/realtime) for one of the providers listed below.

## Providers

Currently, we offers our web SDK for real-time stock prices from the following providers:

* IEX - [Homepage](https://iextrading.com/)
* Cryptoquote - [Homepage](https://cryptoquote.io/)

Each has distinct price channels and quote formats, but a very similar API.

Each data provider has a different format for their quote data.

### IEX

```javascript
{ type: 'ask',
  timestamp: 1493409509.3932788,
  ticker: 'GE',
  size: 13750,
  price: 28.97 }
```

*   **type** - the quote type
  *    **`last`** - represents the last traded price
  *    **`bid`** - represents the top-of-book bid price
  *    **`ask`** - represents the top-of-book ask price
*   **timestamp** - a Unix timestamp (with microsecond precision)
*   **ticker** - the ticker of the security
*   **size** - the size of the `last` trade, or total volume of orders at the top-of-book `bid` or `ask` price
*   **price** - the price in USD

### Cryptoquote

#### Book Update
```ruby
{ pair: {
    name: "BTCUSD",
    code: "btcusd"
  },
  exchange: {
    name: "Gemini",
    code: "gemini"
  },
  side: "buy",
  price: 6337.4,
  size: 0.3,
  type: "book_update" }
```

*   **pair** - details of the currency pair
  *    **name** - the name of the currency pair
  *    **code** - the code of the currency pair
*   **exchange** - details of the exchange from which the message came from
  *    **name** - the name of the exchange
  *    **code** - the code of the exchange
*   **side** - the side of the book this update is for
  *    **`buy`** - this is an update to the buy side of the book
  *    **`sell`** - this is an update to the sell side of the book
*   **price** - the price of this book entry
*   **size** - the size of this book entry
*   **type** - the type of message this is
  *    **`book_update`** - a message that denotes a change to an order book
  *    **`ticker`** - a snapshot of the market as depicted by the Exchange
  *    **`trade`** - a trade message (updating `last_trade_price`, `last_trade_time`, and `last_trade_size`)

#### Ticker
```ruby
{ last_updated: "2018-10-29 23:08:02.277Z",
  pair: {
    name: "BTCUSD",
    code: "btcusd"
  },
  exchange: {
    name: "Binance",
    code: "binance"
  },
  bid: 6326,
  bid_size: 6.51933000,
  ask: 6326.97,
  ask_size: 6.12643000,
  change: -151.6899999999996,
  change_percent: -2.340895061728389,
  volume: 13777.232772,
  open: 6480,
  high: 6505.01,
  low: 6315,
  last_trade_time: "2018-10-29 23:08:01.834Z",
  last_trade_side: nil,
  last_trade_price: 6326.97000000,
  last_trade_size: 0.00001200,
  type: "ticker" }
```

*   **last_updated** - a UTC timestamp of when the ticker was last updated
*   **pair** - details of the currency pair
  *    **name** - the name of the currency pair
  *    **code** - the code of the currency pair
*   **exchange** - details of the exchange from which the message came from
  *    **name** - the name of the exchange
  *    **code** - the code of the exchange
*   **ask** - the ask for the currency pair on the exchange
*   **ask_size** - the size of the ask for the currency pair on the exchange
*   **bid** - the bid for the currency pair on the exchange
*   **bid_size** - the size of the bid for the currency pair on the exchange
*   **change** - the notional change in price since the last ticker
*   **change_percent** - the percent change in price since the last ticker
*   **volume** - the volume of the currency pair on the exchange
*   **open** - the opening price of the currency pair on the exchange
*   **high** - the highest price of the currency pair on the exchange
*   **low** - the lowest price of the currency pair on the exchange
*   **last_trade_time** - a UTC timestamp of the last trade for the currency pair on the exchange
*   **last_trade_side** - the side of the last trade
  *    **`buy`** - this is an update to the buy side of the book
  *    **`sell`** - this is an update to the sell side of the book
*   **last_trade_price** - the price of the last trade for the currency pair on the exchange
*   **last_trade_size** - the size of the last trade for the currency pair on the exchange
*   **type** - the type of message this is
  *    **`book_update`** - a message that denotes a change to an order book
  *    **`ticker`** - a snapshot of the market as depicted by the Exchange
  *    **`trade`** - a trade message (updating `last_trade_price`, `last_trade_time`, and `last_trade_size`)

#### Trade
```ruby
{ last_updated: "2018-10-29 23:08:02.277Z",
  pair: {
    name: "BTCUSD",
    code: "btcusd"
  },
  exchange: {
    name: "Gemini",
    code: "gemini"
  },
  bid: nil,
  bid_size: nil,
  ask: nil,
  ask_size: nil,
  change: -133.40760000000046,
  change_percent: -2.059762280845255,
  volume: 22121.79710206001,
  open: 6476.8445,
  high: 6506.2724,
  low: 6311,
  last_trade_time: "2018-10-29 23:08:01.834Z",
  last_trade_side: "sell",
  last_trade_price: 6343.7124,
  last_trade_size: 1.6045,
  type: "trade" }
```

*   **last_updated** - a UTC timestamp of when the ticker was last updated
*   **pair** - details of the currency pair
  *    **name** - the name of the currency pair
  *    **code** - the code of the currency pair
*   **exchange** - details of the exchange from which the message came from
  *    **name** - the name of the exchange
  *    **code** - the code of the exchange
*   **ask** - the ask for the currency pair on the exchange
*   **ask_size** - the size of the ask for the currency pair on the exchange
*   **bid** - the bid for the currency pair on the exchange
*   **bid_size** - the size of the bid for the currency pair on the exchange
*   **change** - the notional change in price since the last ticker
*   **change_percent** - the percent change in price since the last ticker
*   **volume** - the volume of the currency pair on the exchange
*   **open** - the opening price of the currency pair on the exchange
*   **high** - the highest price of the currency pair on the exchange
*   **low** - the lowest price of the currency pair on the exchange
*   **last_trade_time** - a UTC timestamp of the last trade for the currency pair on the exchange
*   **last_trade_side** - the side of the last trade
  *    **`buy`** - this is an update to the buy side of the book
  *    **`sell`** - this is an update to the sell side of the book
*   **last_trade_price** - the price of the last trade for the currency pair on the exchange
*   **last_trade_size** - the size of the last trade for the currency pair on the exchange
*   **type** - the type of message this is
  *    **`book_update`** - a message that denotes a change to an order book
  *    **`ticker`** - a snapshot of the market as depicted by the Exchange
  *    **`trade`** - a trade message (updating `last_trade_price`, `last_trade_time`, and `last_trade_size`)

## Channels

### IEX

To receive price quotes from IEX, you need to instruct the client to "join" a channel. A channel can be
* A security ticker (`AAPL`, `MSFT`, `GE`, etc)
* The security lobby (`$lobby`) where all price quotes for all securities are posted
* The security last price lobby (`$lobby_last_price`) where only last price quotes for all securities are posted

Special access is required for both lobby channels. [Contact us](mailto:sales@intrinio.com) for more information.

### Cryptoquote

To receive price quotes from Cryptoquote, you need to instruct the client to "join" a channel. A channel can be
* The lobby (`crypto:lobby`) where all message types for all currency pairs are posted
* The type lobby (`crypto:lobby:{message_type}`) where all messages for the given type for all currency pairs are posted (i.e. `crypto:lobby:trade`)
* The pair lobby (`crypto:pair:{pair_code}`) where all message types for the provided currency pair are posted (i.e. `crypto:pair:btcusd`)
* The book_update pair lobby (`crypto:pair:book_update:{pair_code}`) where book_updates for the provided currency pair are posted (i.e. `crypto:pair:book_update:btcusd`)
* The ticker pair lobby (`crypto:pair:ticker:{pair_code}`) where tickers for the provided currency pair are posted (i.e. `crypto:pair:ticker:btcusd`)
* The trade pair lobby (`crypto:pair:trade:{pair_code}`) where trades for the provided currency pair are posted (i.e. `crypto:pair:trade:btcusd`)

## Documentation

### Methods

`constructor(options)` - Creates a new instance of the IntrinioRealtime client.
* **Parameter** `options`: An object with a `api_key` property corresponding to your Intrinio API Key or a `public_key` property corresponding to your Intrinio Public Access Key, as well as a `provider` property designating which realtime vendor to use ("iex" or "cryptoquote").
```javascript
var ir = new IntrinioRealtime({
  api_key: "YOUR_INTRINIO_API_KEY",
  provider: "iex"
})
```

---------

`destroy()` - Closes the WebSocket, stops the self-healing and heartbeat intervals. You MUST call this to dispose of the client.

---------

`onError(callback)` - Invokes the given callback when a fatal error is encountered. If no callback has been registered and no `error` event listener has been registered, the error will be thrown.
* **Parameter** `callback` - The callback to invoke. The error will be passed as an argument to the callback.

---------

`onQuote(callback)` - Invokes the given callback when a quote has been received.
* **Parameter** `callback` - The callback to invoke. The quote will be passed as an argument to the callback.
```javascript
ir.onQuote(function(quote) {
  console.log("QUOTE: ", quote)
})
```

---------

`join(...channels)` - Joins the given channels. This can be called at any time. The client will automatically register joined channels and establish the proper subscriptions with the WebSocket connection.
* **Parameter** `channels` - An argument list or array of channels to join. See Channels section above for more details.
```javascript
ir.join("AAPL", "MSFT", "GE")
ir.join(["GOOG", "VG"])
ir.join("$lobby")
```

---------

`leave(...channels)` - Leaves the given channels.
* **Parameter** `channels` - An argument list or array of channels to leave.
```javascript
ir.leave("AAPL", "MSFT", "GE")
ir.leave(["GOOG", "VG"])
ir.leave("$lobby")
```

---------

`leaveAll()` - Leaves all joined channels.

---------

`listConnectedChannels()` - Returns the list of joined channels. Recently joined channels may not appear in this list immediately.
