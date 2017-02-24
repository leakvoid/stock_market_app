'use strict';

var Users = require('../models/users.js');
var Stocks = require('../models/stocks.js');
var mongoose = require('mongoose');

var request = require('request');

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ ssl: true, port: 3000 });

//var WebSocket = require('ws');
//var ws = new WebSocket('ws://127.0.0.1/');

function MainController() {

    /*this.home = function(req, res) {
        var stock = 'MMM';
        var year = '2016';
        var month = '02';
        var url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + stock + '.json?api_key=scg9nFzbjxfysc6spmY3&start_date=' + year + '-' + month + '-01&end_date=' + year + '-' + month + '-28';
        console.log(url);

        request(url, function(err, stock_res, stock_body) {
            if(!err && stock_res.statusCode == 200) {
                console.log(JSON.stringify(JSON.parse(stock_body)));

                res.render('main/home',
                           { 'stock_data': JSON.parse(stock_body),
                             'title': 'Home Page',
                             'auth_status': req.isAuthenticated() });
            } else {
                console.log(err);
                res.send('Quandl service is down');
            }
        });
    };*/

    this.home = function(req, res) {
        res.render('main/home',
                   { 'title': 'Home Page',
                     'auth_status': req.isAuthenticated() });
    };

    /* db access methods */

    function find_all_stocks(callback) {
        Stocks
            .find({})
            .exec( function(err, stocks) {
                if(err)
                    return callback(err);

                callback(null, { 'stocks': stocks });
            });
    }

    function find_stock(stock_name, callback) {
        Stocks
            .find({'stock_name': stock_name.toLowerCase()})
            .exec( function(err, stock) {
                if(err)
                    return callback(err);

                callback(null, { 'stock': stock });
            });
    }

    function save_stock(stock_name, callback) {
        var new_stock = new Stocks();

        new_stock.stock_name = stock_name.toLowerCase();

        new_stock.save( function(err) {
            if(err)
                return callback(err);

            callback(null, { 'stock': new_stock });
        });
    }

    function delete_stock(stock_name, callback) {
        Stocks
            .find({'stock_name': stock_name.toLowerCase()})
            .remove()
            .exec( function(err) {
                if(err)
                    return callback(err);

                callback(null);
            });
    }

    /* loading data from quandl server */

    function filter_quandl_responce(stock_body) {
        var stock_dataset = JSON.parse(stock_body).dataset;

        var result = {}, filtered_data = [];
        result[stock_dataset.dataset_code] = filtered_data;

        stock_dataset.data.forEach( function(row) {
            var f_row = {};
            f_row[row[0]] = row[1];
            filtered_data.push(f_row);
        });

        return result;
    }

    function load_stocks(callback) {
        find_all_stocks( function(err, fas_res) {
            if(err)
                return callback(err);

            var stocks_data = [];
            fas_res.stocks.forEach( function(db_stock) {
                var today = new Date();
                var month_ago = new Date();
                month_ago.setMonth(month_ago.getMonth() - 1);
                
                var url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + db_stock.stock_name +
                    '.json?api_key=scg9nFzbjxfysc6spmY3&start_date=' +
                    month_ago.getFullYear() + '-' + (month_ago.getMonth() + 1) + '-' + month_ago.getDate() +
                    '&end_date=' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
                //var year = '2016';
                //var month = '02';
                /*var url = 'https://www.quandl.com/api/v3/datasets/WIKI/' + db_stock.stock_name +
                    '.json?api_key=scg9nFzbjxfysc6spmY3&start_date=' +
                    year + '-' + month + '-01&end_date=' + year + '-' + month + '-28';*/
                console.log('[QUANDL_URL]:' + url);

                request(url, function(err, stock_res, stock_body) {
                    if(!err && stock_res.statusCode == 200) {
                        console.log( '[QUANDL_RESPONCE]:' + JSON.stringify(JSON.parse(stock_body)) );

                        var stock_data = filter_quandl_responce( stock_body );
                        stocks_data.push( stock_data );

                        if( stocks_data.length === fas_res.stocks.length )
                            return callback(null, stocks_data);//CHECK
                    } else {
                        console.log(err);
                        return callback(err);//CHECK 
                    }
                });
            });
        });
    }

    //find_all_stocks(function(err, fas_res) {
    //save_stock(message.stock_name, function(err, as_res) {

    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(msg) {
            var message = JSON.parse(msg);
            console.log('received: %s', message.type);

            switch(message.type) {
            case 'init':
                load_stocks(function(err, stocks) {
                    if(err)
                        ws.send( JSON.stringify({'type': 'service_error'}) );
                    else {
                        ws.send( JSON.stringify({'type': 'initial_update', 'stocks_data': stocks}) );
                    }
                });
                break;
            case 'add_stock':
            case 'remove_stock':
                function on_stock_change(err, sc_res) {
                    if(err)
                        return ws.send( JSON.stringify({'type': (message.type === 'add_stock' ? 'add_failure' : 'remove_failure'),
                                                        'stock_name': message.stock_name}) );

                    load_stocks(function(err, stocks) {
                        if(err)
                            return ws.send( JSON.stringify({'type': 'service_error'}) );

                        wss.clients.forEach(function(client) {
                            var responce_type = 'external_update';
                            if(client === ws)
                                responce_type = (message.type === 'add_stock' ? 'add_success' : 'remove_success');

                            client.send( JSON.stringify({'type': responce_type, 'stock_name': message.stock_name, 'stocks_data': stocks}) );
                        });
                    });
                }

                if(message.type === 'add_stock')
                    save_stock(message.stock_name, on_stock_change);
                else
                    delete_stock(message.stock_name, on_stock_change);

                break;
            default:
                ws.send( JSON.stringify({'type': 'package_error'}) );
            }
        });
    });

}

module.exports = MainController;
