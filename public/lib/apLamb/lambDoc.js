/*
 Lamb:  "Little Angular Message Bus"

 This factory returns a singleton class named "Lamb".
 You must construct it before using. See the class definition, below.

 JSFiddle: http://jsfiddle.net/alvin_pivowar/do8o3yst/
 */

/*
 Public Class "Lamb"

 var lamb = new Lamb(clientName, [scope]);

 lamb.clientId  unique string identifier composed of name and scope.$id
 lamb.dispose();
 lamb.publish(topic, data);
 lamb.subscribe(topic, callbackFn);
 lamb.unsubscribe(topic);
 */

/*
 LambConfig {
     logLevel: "None", "Normal", or "Verbose" (default: "None"),

     // Optional, default sock is based on server hosting the index.html page, default channel is "BLEAT"
     socks: [{
        protocol: (string),
        host: (string),
        port: (string),
        channel: (string)
     }]
 }
 */

/*
    Lamb:  "Little Angular Message Bus"

    Lamb exposes a pub/sub message bus that allows your AngularJS recipes to interact independent of DOM topology or
    $watches.  The advantage of a pub/sub architecture is that publishers are unaware (and don't care) of whether there
    are active subscribers for the messages that they publish.  Similarly, subscribers do not care from whom the
    messages originate.

    Usage:
        1.  Include the module apLamb into the application.
 */