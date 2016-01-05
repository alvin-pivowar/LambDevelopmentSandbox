# apLambSocks API Documentation

apLambSocks is an AngularJS module that adds asynchronous socket.io handling to an application that is using apLamb for messaging.
  Services that publish messages register **transforms** with apLambSocks.  These transforms convert server-centric socket.io messages to client-centric apLamb messages.

apLambSocks is uses apLamb and apSock.

## Configuration

apLambSocks uses the same configuration object as apLamb.
  In addition to ```logLevel```, the object also contains an array of Sock instances.
  apLambSocks will attach a handler to each sock within the array.
  If there is no sock definition, then apLambSocks will attach a handler to the default Sock.
  When the channel is unspecified (or using the default Sock), the channel will be "BLEAT".

## Service

The apLambSocks API is provided by the ```lambSocks``` service.

## Registration

```registerTransform(pattern, transformFn)  // returns transformId```

> pattern: (required) A RegExp that will be used to match against the server message.

> transformFn (required) The function that will be called to transform the message.

## Transforms

A registered transform is represented by this object:

```javascript
Transform: {
    identity: {
        id: (string)
        pattern: (RegExp)
        sock: (Sock)
    }
    fn: (function)
    priority: (number)
}
```

When you register a transform, you will be returned it's ID.
  The following API calls are used to manage registered transforms:

* ```getTransformsByCriteria(criteria)   // returns Transform []```
* ```getTransformById(id)   // returns Transform```
* ```unregisterTransformsByCriteria(criteria)    // returns boolean success```
* ```unregisterTransformById(id)    // returns boolean success```
* ```unregisterTransformsByPattern(RegExp) // returns boolean success```

Where

```javascript
Criteria: {
    host: (string)
    port: (number)
    channel: (string)
    id: (number)
    pattern: (RegExp)
}
```

Function names that contain 'Transforms' rather then 'Transform', operate on zero or more transforms.

The priority of the transform is used when a message is received:
  All of the transforms that match an incoming message will be called in priority order; highest number first.
  The default priority is 100.

> Note: To set a transform priority, you must register the transform, and then get the transform object.

## The transform callback

```callback(SockMessage)    // returns LambMessage or promise (see below)```

The onus of a transform is to convert a SockMessage into a LambMessage.
  A SockMessage is passed in, and a LambMessage is returned.
  If the result is ```null```, then it is equivalent to:

```javascript
result: {
    data: sockMessage.receivedData
    topic: sockMessage.receivedTopic
}
```

Here is the definition of the transform's input and output objects:

```javascript
SockMessage: {
    history: []
    lambMessages: []
    receivedData: (object)
    receivedDateTime: (Date)
    receivedTopic: (string)
    sock: Sock
}
```

> history:  An array of

```javascript
TransformHistoryItem: {
    lambMessage: (LambMessage)
    transformDateTime: (Date)
    trasnsformIdentity: (TransformIdentity) // See Transform, above
    transformPriority: (number)
}
```

> lambMessages: An array composed of all of the LambMessage results from the called transforms.

```javascript
LambMessage: {
    data: (object)
    publishDateTime: (Date)
    topic: (string)
}
```

> receivedData: The data object returned from the server.

> receivedDateTime: The ```Date``` of when the server message was received.

> receivedTopic: The server-side topic string.

> sock: The Sock object that received the message.

#### Transform Result / Promises

A transform result can be:

* ```null```: The result will be interpreted as LambMessage(serverTopic, ServerData)

* LambMessage: The sockMessage history and lambMessages properties will be updated and the result will be published on the bus.

* An AngularJS promise (```$q```): When the promise is (successfully) fulfilled, the result of the promise (a LambMessage) will be processed as above.

> The purpose of allowing a transform function to return a promise is to allow the building of messages that require other services.


