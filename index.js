var http = require('http');
var url = require('url');
var fs = require('fs');

let portN = 27017;

http.createServer(function(req, res) {
    var q = url.parse(req.url, true);
    var filename = "." + q.pathname;
    fs.readFile(filename, function(err,data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end("404 Not Found");
        }
        res.writeHead(200);
        res.write(data);
        return res.end();
    });
}).listen(portN);
console.log("Local server on port: " + portN);