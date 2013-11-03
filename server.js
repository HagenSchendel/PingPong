var _ = require('underscore');
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
var updateClients;

function update(client) {
    console.log('emit to client %s', client.id);

    client.write(JSON.stringify({message: 'Ping'}));

    updateClients();
}

function updateFinished() {
    console.log('done emitting data to all clients');
}

var config = {host: '0.0.0.0', port: 1337, prefix: '/data'};

sockjsServer.start(config, function (sockjs) {
    sockjs.on('connection', function (connection) {
        connectedClients.push(connection);

        updateClients = _.after(connectedClients.length, updateFinished);

        connection.on('data', function (data) {
            console.log('Received data: %s', JSON.stringify(data));
            _.each(connectedClients, update);
        });
    });
});
