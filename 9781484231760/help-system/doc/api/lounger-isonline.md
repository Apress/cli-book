lounger-isonline(3) -- check if a database is online
====================================================

## SYNOPSIS

    lounger.commands.isonline(url)

## DESCRIPTION

Check if a CouchDB / PouchDB database is available on the current
network.

url:
The url must be a `String` and must be an url using the http or https
protocol.

The command returns a promise. The promise returns an Object. The key
of the Object is the provided url and the values are of type `Boolean`.
`true` indicates an online CouchDB / PouchDB node.
