var path = require("path");
var util = require("util");
var async = require("async");
var _ = require("underscore");
var http = require("http");
var express = require("express");
var app = express();
var host = "0.0.0.0";
var port = 1337;
var server = http.createServer(app);

var sockjs = require('sockjs');
var sockjsServer = sockjs.createServer();
sockjsServer.installHandlers(server, {prefix: '/data'});
console.log(' [*] Listening on ' + host + ':' + port);
server.listen(port, host);

var connectedClients = [];

sockjsServer.on('connection', function (connection) {
    connectedClients.push(connection);
    connection.on('data', function (data) {
        util.log("Received data: " + JSON.stringify(data));
    });
});

function updateClients() {
    var clientsToNotify = _.clone(connectedClients);
    async.forEach(
        clientsToNotify,
        function (client, done) {
            util.log("emit to client " + client.id);
            try {
                client.write("Ping");
            } catch (err) {
                done(err);
            }
            done(null);
        },
        function (err) {
            if (typeof err !== "undefined" && err !== null) {
                util.log(err);
            } else {
                util.log("done emitting data to all clients");
            }
        }
    );
}

app.configure(function () {
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get("/", function (req, res) {
    res.json("Hello World");
    res.end();

});




