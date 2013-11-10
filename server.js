"use strict";

var _ = require('lodash');
var _ = require('./www/pingpong');
var sockjsServer = require('./sockjs-server');

/**
 * Holds all connected clients.
 * @type {Array}
 */
var connectedClients = [];

/**
 * Wrapper function that is only evaluated after being
 * called {@code connectedClients.length} times, i.e. in
 * this case after all clients have been updated.
 * @type {Function}
 */
var updatedClient;

function update(client) {
    console.log('Emit to client %s.', client.id);

    client.write(JSON.stringify({message: 'Ping'}));

    updatedClient();
}

function updateFinished() {
    console.log('Done emitting data to all clients.');
}

var config = {host: '0.0.0.0', port: 1337, prefix: '/data'};

sockjsServer.start(config, function (sockjs) {
    console.log('[*] Listening on %s:%s', config.host, config.port);

    sockjs.on('connection', function (connection) {
        connectedClients.push(connection);

        updatedClient = _.after(connectedClients.length, updateFinished);

        connection.on('data', function (data) {
            console.log('Received data: %s.', data);
            _.each(connectedClients, update);
        });
    });
});
