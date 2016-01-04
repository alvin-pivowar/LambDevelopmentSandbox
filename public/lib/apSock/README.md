# apSock API Documentation

apSock is an AngularJS service that provides a simple API to the socket.io library.

Features:

* Any number of listeners can be active.
* Listeners can use the same or different servers.
* The service can initialize the socket.io library dynamically; you do not have to reference socket.io.js in the index file.

# The ```Sock``` class

```javascript
Sock: {
    protocol: (string)
    host: (string)
    port: (number)
    channel: (string)
}
```

Constructor:

```javascript
var sock;
sock = new Sock(protocol, host, port, channel);  // or
sock = Sock(protocol, host, port, channel);
```

All parameters are required, but any may be ```null```.  If ```host``` is **not** null, then the default values for the other three parameters are:

> protocol: "http"

> port: 80

> channel: ```null```

When ```host``` is null, the defaults for protocol, host, and port are taken from ```$location```.  The default for ```channel``` is ```null```.

#### Default Sock

For the following API calls, if a sock parameter is omitted (or ```null```), then the "default" sock will be used.  The default Sock is built from ```$location```.

## The ```sockService``` API

```javascript
sockService: {
    Sock: Sock

    buildSockPath: (function)
    initializeSocketIo: (function)
    registerListener: (function)
}
```

> Note that the object contains the Sock constructor function.

#### ```buildSockPath()```

```buildSockPath(sock, path)    // returns string```

Given (an optional) sock and URI snippet, construct a full URI.  If sock is omitted, the default Sock will be used.  If a path is specified it will be appended to the URI of the sock.

#### ```initializeSocketIo()```

```initializeSocketIo(sock)     // returns promise```

When this function is called, if the global window object does **not** have ```io``` defined, then the socket.io.js library will be fetched form the server indicated by the sock parameter.  Then, the library will be evaluated.  If a sock is not provided, the default Sock will be used.

#### ```registerListener()```

```javascript
registerListener(sock, callbackFn)  // returns the connected socket.io socket
```

> All parameters are required

Given a sock and a callback function, register the callback function on the ```channel``` of the Sock.  This returns the native socket.io socket.  To stop listening, call ```socket.close()```.

Refer to the socket.io documentation: [http://socket.io/docs](http://socket.io/docs/):
