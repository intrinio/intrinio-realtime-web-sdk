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
  public_key: "YOUR_INTRINIO_PUBLIC_ACCESS_KEY",
  provider: "iex"
})

// Listen for quotes
ir.onQuote(function(quote) {
  console.log(quote)
})

// Join channels
ir.join("AAPL","GE","MSFT")
```

For another example, see the `/sample` folder. Make sure to substitute your own Public Access Key.

## Public Access Key
You can create a Public Access Key after [creating an account](https://intrinio.com/signup). On your Account page, scroll down to Access Keys, click Add New Key, name it, and specify Public. The key will appear on your Account page, which you will need for to use the SDK. You will also need a subscription to a [real-time data feed](https://intrinio.com/marketplace/data/prices/realtime) for one of the providers listed below.

## Providers

Currently, we offers our web SDK for real-time stock prices from the following providers:

* IEX - [Homepage](https://iextrading.com/)
* Cryptoquote - [Homepage](https://cryptoquote.io/)

Each has distinct price channels and quote formats, but a very similar API.

Each data provider has a different format for their quote data.

## Quote Data Format

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

#### Level 1 - Price Update

NOTE: Null values for some fields denote no change from previous value.

```javascript
{ last_updated: "2018-10-29 23:08:02.277Z",
  pair_name: "BTCUSD",
  pair_code: "btcusd",
  exchange_name: "Binance",
  exchange_code: "binance",
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
  last_trade_side: null,
  last_trade_price: 6326.97000000,
  last_trade_size: 0.00001200,
  type: "level_1" }
```

*   **last_updated** - a UTC timestamp of when the data was last updated
*   **pair_name** - the name of the currency pair
*   **pair_code** - the code of the currency pair
*   **exchange_name** - the name of the exchange
*   **exchange_code** - the code of the exchange
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
  *    **`level_1`** - a messages that denotes a change to the last traded price or top-of-the-book bid or ask
  *    **`level_2`** - a message that denotes a change to an order book

#### Level 2 - Book Update
```javascript
{ pair_name: "BTCUSD",
  pair_code: "btcusd",
  exchange_name: "Gemini",
  exchange_code: "gemini",
  side: "buy",
  price: 6337.4,
  size: 0.3,
  type: "level_2" }
```

*   **pair_name** - the name of the currency pair
*   **pair_code** - the code of the currency pair
*   **exchange_name** - the name of the exchange
*   **exchange_code** - the code of the exchange
*   **side** - the side of the book this update is for
  *    **`buy`** - this is an update to the buy side of the book
  *    **`sell`** - this is an update to the sell side of the book
*   **price** - the price of this book entry
*   **size** - the size of this book entry
*   **type** - the type of message this is
  *    **`level_1`** - a messages that denotes a change to the last traded price or top-of-the-book bid or ask
  *    **`level_2`** - a message that denotes a change to an order book

## Channels

### IEX

To receive price quotes from IEX, you need to instruct the client to "join" a channel. A channel can be
* A security ticker (`AAPL`, `MSFT`, `GE`, etc)
* The security lobby (`$lobby`) where all price quotes for all securities are posted
* The security last price lobby (`$lobby_last_price`) where only last price quotes for all securities are posted

Special access is required for both lobby channels. [Contact us](mailto:sales@intrinio.com) for more information.

### Cryptoquote

To receive price quotes from Cryptoquote, you need to instruct the client to "join" a channel. A channel can be

* `crypto:market_level_1:{pair_code}` - the Level 1 Market channel where all Level 1 price updates for the provided currency pair in all exchanges are posted (i.e. `crypto:pair:market_level_1:btcusd`)
* `crypto:exchange_level_1:{exchange_code}:{pair_code}` - the Level 1 Market channel where all Level 1 price updates for the provided currency pair and exchange are posted
* `crypto:exchange_level_2:{exchange_code}:{pair_code}` - the Level 2 Market channel where all Level 2 book updates for the provided currency pair and exchange are posted
* `crypto:firehose` - the Firehose channel where all message types for all currency pairs are posted (special access required)

The Intrinio REST API provides a listing of pairs, exchanges, and their corresponding codes:

* [Crypto Currency Pairs](https://intrinio.com/documentation/download#crypto_currency_pairs)
* [Crypto Exchanges](https://intrinio.com/documentation/download#crypto_exchanges)

## Documentation

### Methods

`constructor(options)` - Creates a new instance of the IntrinioRealtime client.
* **Parameter** `options`: An object with a `public_key` property corresponding to your Intrinio Public Access Key, as well as a `provider` property designating which realtime vendor to use ("iex" or "cryptoquote").
```javascript
var ir = new IntrinioRealtime({
  public_key: "YOUR_INTRINIO_PUBLIC_ACCESS_KEY",
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
