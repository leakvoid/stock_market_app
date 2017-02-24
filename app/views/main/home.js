$(document).ready( function() {

    /*
      request_msg: {
        type: 'add_stock, remove_stock, init',
        stock_name: %stock_name%
      }

      response_msg: {
        type: 'add_success, add_failure, remove_success, remove_failure, initial_update, external_update, service_error, package_error',
        stock_name: %stock_name%
        stocks_data: [
          {%stock_name%: [ {%date%: %value%}, ... ]},
          ...
        ]
      }
    */

    function get_domain_name(hostName)
    {
        return hostName.substring(hostName.lastIndexOf(".", hostName.lastIndexOf(".") - 1) + 1);
    }

    var socket = new WebSocket('ws://' + get_domain_name(window.location.hostname) + ':3000'); // 'ws://localhost:3000'
    var added_stock_names = [];
    google.charts.load('current', {packages: ['corechart', 'line']});

    /* listeners for 'remove-stock' buttons */

    function button_listener() {
        var stock_name = /remove-(.+)-button/.exec( $(this).attr("id") )[1];
        var req_msg = JSON.stringify({'type': 'remove_stock', 'stock_name': stock_name});
        console.log(req_msg);//CHECK delete
        socket.send(req_msg);
    }

    function gen_id(s_name) {
        return 'remove-' + s_name + '-button';
    }

    function remove_listeners() {
        added_stock_names.forEach( function(s_name) {
            $( '#' + gen_id(s_name) ).off( 'click', button_listener );
        });

        added_stock_names = [];
    }

    function register_buttons(stocks_data) {
        stocks_data.forEach( function(stock) {
            added_stock_names.push( Object.keys(stock)[0] );
        });

        var html_result = '';
        added_stock_names.forEach( function(s_name) {
            html_result += '<button type="submit" id="' + gen_id(s_name) + '">' + 
                s_name + ' <i class="fa fa-times" aria-hidden="true"></i></button> ';
        });
        $('#added-stocks-container').html( html_result );
    };


    function register_listeners() {
        added_stock_names.forEach( function(s_name) {
            $( '#' + gen_id(s_name) ).on( 'click', button_listener );
        });
    }

    /* Updating stock related data */

    function refresh_graph(stocks_data) {
        var data = new google.visualization.DataTable();

        data.addColumn('date', 'Date');
        stocks_data.forEach( function(stock) {
            data.addColumn( 'number', Object.keys(stock)[0] );
        });

        var result = [];

        var f_stock = stocks_data[0];
        var f_stock_values = f_stock[ Object.keys(f_stock)[0] ];
        f_stock_values.forEach( function(val, index) {
            var reg_val = /(.+)-(.+)-(.+)/.exec( Object.keys(val)[0] );

            var t = [];
            t.push( new Date(reg_val[1], reg_val[2] - 1, reg_val[3]) );

            result.push( t );
        });

        stocks_data.forEach( function(stock) {
            var stock_values = stock[ Object.keys(stock)[0] ];
            stock_values.forEach( function(val, index) {
                result[index].push( val[ Object.keys(val)[0] ] );
            });
        });

        console.log('[REFRESH_GRAPH]' + result);//CHECK delete
        data.addRows(result);

        var options = {
            hAxis: {
                title: 'Date'
            },
            vAxis: {
                title: 'Value'
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById('graph-container'));
        chart.draw(data, options);
    }

    function refresh_added_stocks(stocks_data) {
        remove_listeners();
        register_buttons(stocks_data);
        register_listeners();
    }

    function clear_stock_input() {
        $('#new-stock-input').val('');
    }

    function update_stock_module(stocks_data) {
        refresh_graph(stocks_data);
        refresh_added_stocks(stocks_data);
        clear_stock_input();
    }

    /* Updating flash message */

    function update_flash_message(msg_type, stock_name) {
    }

    /* Web Socket initialization */

    socket.onopen = function(event) {
        /* activate 'Add Stock' button */
        $('#new-stock-button').prop('disabled', false);
        $('#new-stock-button').on('click', function() {
            var stock_name = $('#new-stock-input').val();
            var req_msg = JSON.stringify({'type': 'add_stock', 'stock_name': stock_name});
            socket.send(req_msg);
        });

        /* request data through WS */
        var req_msg = JSON.stringify({'type': 'init'});
        socket.send(req_msg);
    };

    /* response to stock updates by users / initialization */
    socket.onmessage = function(event) {
        console.log('ONMESSAGE EVENT: [' + event.data + ']');//CHECK delete
        var res_msg = JSON.parse(event.data);

        if( res_msg.stocks_data ) {
            console.log('UPDATE_STOCK_MODULE');//CHECK delete
            update_stock_module(res_msg.stocks_data);
        }

        update_flash_message(res_msg.type, res_msg.stock_name);
    };

});
