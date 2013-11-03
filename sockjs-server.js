"use strict";

/**
 * Configure a static web content server using ExpressJS (http://expressjs.com).
 * Static content is served from the directory '/www'.
 */
function configureExpressJs(callback) {
    var express = require('express');
    var e = express();
    e.configure(function () {
        e.use(e.router);
        e.use(express.static(__dirname + '/www'));
        e.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });
    callback(e);
}

/**
 * Create a web server instance using the Node.js 'http' module.
 */
function createHttpServer(configuredExpressInstance, callback) {
    var http = require('http');
    callback(http.createServer(configuredExpressInstance));
}

/**
 * Attach a SockJS (https://github.com/sockjs) server to the server instance.
 */
function attachSockJsToHttpServer(httpServer, prefix, callback) {
    var sockjs = require('sockjs');
    var sockjsServer = sockjs.createServer();
    var config = {prefix: prefix};
    sockjsServer.installHandlers(httpServer, config);
    callback(sockjsServer);
}

/**
 * Start the server.
 */
exports.start = function (config, callback) {
    configureExpressJs(function (expressInstance) {
        createHttpServer(expressInstance, function (httpServer) {
            attachSockJsToHttpServer(httpServer, config.prefix,
                function (sockjsServer) {
                    httpServer.listen(config.port, config.host);
                    console.log(' [*] Listening on %s:%s',
                        config.host, config.port);
                    callback(sockjsServer);
                });
        });
    });
};
