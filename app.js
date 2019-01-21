var request = require('request');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
const WebSocket = require('ws');
var doc = new GoogleSpreadsheet('1j3SjsRrBmX6w5xL36Mb36iNDeFLRpIKUMliL0aBeU8g');
const TIMEOUT = 10000;
var RestClient = require("deribit-api").RestClient;
const BitMEXClient = require('bitmex-realtime-api');
var restClient = new RestClient();
const client = new BitMEXClient({
    // Set API Key ID and Secret to subscribe to private streams. See `Available
    // Private Streams` below.
    apiKeyID: 'Su37RFUe2ShvyPY4PVXuMdDB',
    apiKeySecret: 'i4yq0XtCQlZIDTj8Zid7NO-H71fndtrL4b2T_ea6RYo_j5Nq',
    maxTableLen: 10000 // the maximum number of table elements to keep in memory (FIFO queue)
});
client.addStream('XBTUSD', 'quote', (data) => {
    bids['bitmex'] = [
        data[data.length - 1].bidPrice,
        data[data.length - 1].bidSize
    ]
    asks['bitmex'] = [
        data[data.length - 1].askPrice,
        data[data.length - 1].askSize
    ]
});
restClient
    .getorderbook('BTC-PERPETUAL')
    .then((result) => {
        var as = []
        var bs = []
        var da = []
        var db = []
        for (var a in result.result.asks) {
            da.push(result.result.asks[a].amount)
            as.push(result.result.asks[a].price)
        }
        for (var b in result.result.bids) {
            db.push(result.result.bids[b].amount)
            bs.push(result.result.bids[b].price)
        }
        var hb = 0;
        var wb;
        var wa;
        var la = 1000000000000000000000000000000000000;
        for (var a in as) {
            if (as[a] < la) {
                la = as[a];
                wa = da[a];
            }
        }
        for (var b in bs) {
            if (bs[b] > hb) {
                wb = db[b]
                hb = bs[b]
            }
        }
        asks['deribit'] = ([la, wa]);
        bids['deribit'] = ([hb, wb]);
    });
let chai = require('chai');
let assert = chai.assert;
let path = require('path');
let huobi = require(path.resolve(__dirname, 'node-huobi-api.js'));
let util = require('util');
huobi.options({APIKEY: 'f524d69a-212513b2-064f4509-ea3c0', useServerTime: true, reconnect: true, verbose: true});
huobi
    .websockets
    .depthCache(['btcusdt'], (symbol, depth) => {
        var as = []
        var bs = []
        var da = []
        var db = []
        for (var a in depth.asks) {
            as.push(parseFloat(a))
            da.push(depth.asks[a])
        }
        for (var b in depth.bids) {
            bs.push(parseFloat(b))
            db.push(depth.bids[b])
        }
        var hb = 0;
        var wb;
        var wa;
        var la = 1000000000000000000000000000000000000;
        for (var a in as) {
            if (as[a] < la) {
                la = as[a];
                wa = da[a];
            }
        }
        for (var b in bs) {
            if (bs[b] > hb) {
                wb = db[b]
                hb = bs[b]
            }
        }
        asks['huobi'] = ([
            la, la * wa
        ]);
        bids['huobi'] = ([
            hb, hb * wb
        ]);
    }, 10);
var instruments = [];
var asks = {}
var bids = {}
async.series([
    function setAuth(step) {
        var creds = require('../googlesheets.json');

        doc.useServiceAccountAuth(creds, step);
    },
    function getInfoAndWorksheets(step) {
        doc
            .getInfo(function (err, info) {
                console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
                sheet = info.worksheets[0];
                console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
                step();
            });
    },
    function workingWithRows(step) {
        const ws = new WebSocket('wss://api.quedex.net/market_stream');

        ws.on('open', function open() {
            ws.send('something');
        });

        ws.on('message', function incoming(data) {
            data = JSON.parse(data);
            for (var i in data) {
                data[i] = data[i]
                    .toString()
                    .replace(/(\r\n\t|\n|\r\t)/gm, "");;
                if (data[i].includes('{') && data[i].includes('}') && data[i].includes('instrument_data')) {
                    var json = JSON.parse(data[i].substring(data[i].indexOf('{'), data[i].lastIndexOf('}') + 1));
                    for (var a in json.data) {
                        if (json.data[a].type.includes('futures') && json.data[a].symbol.includes('BTC')) {
                            instruments.push(a);
                        }
                    }
                } else if (data[i].includes('{') && data[i].includes('}') && data[i].includes('order_book')) {
                    var json = JSON.parse(data[i].substring(data[i].indexOf('{'), data[i].lastIndexOf('}') + 1));
                    if (instruments.includes(json.instrument_id)) {
                        var as = []
                        var bs = []
                        var da = []
                        var db = []
                        for (var a in json.asks) {
                            as.push(parseFloat(json.asks[a][0]))
                            da.push(parseFloat(json.asks[a][1]))
                        }
                        for (var b in json.bids) {
                            bs.push(parseFloat(json.bids[b][0]))
                            db.push(parseFloat(json.asks[b][1]))
                        }
                        var hb = 0;
                        var wb;
                        var wa;
                        var la = 1000000000000000000000000000000000000;
                        for (var a in as) {
                            if (as[a] < la) {
                                la = as[a];
                                wa = da[a];
                            }
                        }
                        for (var b in bs) {
                            if (bs[b] > hb) {
                                wb = db[b]
                                hb = bs[b]
                            }
                        }
                        asks['quedex'] = ([la, wa]);
                        bids['quedex'] = ([hb, wb]);
                    }
                }
            }
        });

    }
])
function doThatThing() {
    var hb = 0;
    var hbtext;
    var latext;
    var wb;
    var wa;
    var la = 1000000000000000000000000000000000000;
    for (var a in asks) {
        if (asks[a][0] < la) {
            la = asks[a][0];
            wa = asks[a][1];
            latext = a;
        }
    }
    for (var b in bids) {
        if (bids[b][0] > hb) {
            hb = bids[b][0];
            wb = bids[b][1];
            hbtext = b;
        }

    }
    if (hb > la) {

        console.log('highest bid ' + hbtext + ': ' + hb + ' with ' + wb + ' vol')
        console.log('lowest ask ' + latext + ': ' + la + ' with ' + wa + ' vol')
        if (wb > wa) {
            var v = wa;
        } else {
            var v = wb;
        }
        sheet
            .addRow({
                'Time': new Date().toLocaleString(),
                'AskEx': latext,
                'BidEx': hbtext,
                'Ask': la,
                'Bid': hb,
                'AskVol': wa,
                'BidVol': wb,
                'Diff': hb - la,
                'Percent': (hb - la) / la,
                'LowerVolume': v,
                'Earned': (v / la) * (hb - la)
            }, function (result) {
                console.log(result);
            })
    }
}

setTimeout(function () {
    doThatThing()
}, 5000);
setInterval(function () {
    doThatThing()
}, 15 * 1000);
