var util = require("util");
var _ = require("underscore");

/**
 * Configure a static web content server using ExpressJS (http://expressjs.com).
 * Static content is served from the directory '/www'.
 */
var express = require("express");
var app = express();
app.configure(function () {
    app.use(app.router);
    app.use(express.static(__dirname + "/www"));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
var host = "0.0.0.0";

/**
 * Create a web server instance using the Node.js 'http' module.
 */
var http = require("http");
var port = 1337;
var server = http.createServer(app);

/**
 * Attach a SockJS (https://github.com/sockjs) server to the server instance.
 */
var sockjs = require('sockjs');
var sockjsServer = sockjs.createServer();
sockjsServer.installHandlers(server, {prefix: '/data'});
server.listen(port, host);
console.log(' [*] Listening on ' + host + ':' + port);

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

sockjsServer.on('connection', function (connection) {
    connectedClients.push(connection);

    updateClients = _.after(connectedClients.length, updateFinished);

    connection.on('data', function (data) {
        util.log("Received data: " + JSON.stringify(data));
        _.each(connectedClients, update);
    });
});

var update = function (client) {
    util.log("emit to client " + client.id);
    try {
        client.write(JSON.stringify({ message: "Ping"}));
    } catch (err) {
        util.log(err);
    }
    updateClients();
};

var updateFinished = function () {
    util.log("done emitting data to all clients");
};






