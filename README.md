# Intrinio Web SDK for Real-Time Stock and Forex Prices

[Intrinio](https://intrinio.com/) provides real-time stock and forex prices via a two-way WebSocket connection.

## Features

* Receive streaming, real-time price quotes (last trade, bid, ask)
* Subscribe to updates from individual securities or forex pairs
* Subscribe to updates for all securities or forex pairs

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
* FXCM - [Homepage](https://www.fxcm.com/)

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

### FXCM

#### Price update
```javascript
{ code: "EUR/USD",
  bid_price: 1.13685,
  ask_price: 1.13711,
  time: "2018-12-18 22:38:06.964Z" }
```

*   **code** - the code of the fx currency pair
*   **bid_price** - the bid price is the price a buyer is willing to pay
*   **ask_price** - the ask price is the price a seller is willing to accept
*   **time** - the UTC timestamp of the price update

## Channels

### IEX

To receive price quotes from IEX, you need to instruct the client to "join" a channel. A channel can be
* A security ticker (`AAPL`, `MSFT`, `GE`, etc)
* The security lobby (`$lobby`) where all price quotes for all securities are posted
* The security last price lobby (`$lobby_last_price`) where only last price quotes for all securities are posted

Special access is required for both lobby channels. [Contact us](mailto:sales@intrinio.com) for more information.

### FXCM

To receive price quotes from FXCM, you need to instruct the client to "join" a channel. A channel can be

* `fxcm:pair:{pair_code}` - the fx currency pair channel where price updates for the provided currency pair are posted (i.e. `fxcm:pair:EUR/USD`)
* `fxcm:base:{currency_code}` - the fx currency channel where prices updates for any fx currency pair that has the provided currency as the base currency (i.e. `fxcm:base:EUR` would post prices from EUR/USD, EUR/JPY, etc.)
* `fxcm:quote:{currency_code}` - the fx currency channel where prices updates for any fx currency pair that has the provided currency as the quote currency (i.e. `fxcm:quote:USD` would post prices from EUR/USD, JPY/USD, etc.)

The Intrinio REST API provides a listing of pairs, currencies, and their corresponding codes:

* [FX Currencies](https://docs.intrinio.com/documentation/download/currencies)
* [FX Currency Pairs](https://docs.intrinio.com/documentation/download/currency_pairs)

## Documentation

### Methods

`constructor(options)` - Creates a new instance of the IntrinioRealtime client.
* **Parameter** `options`: An object with a `public_key` property corresponding to your Intrinio Public Access Key, as well as a `provider` property designating which realtime vendor to use ("iex" or "fxcm").
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
