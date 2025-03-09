# Networking (net)

...

## Work In Progress

* New line character appears safe to use: https://chromium.googlesource.com/v8/v8/+/f2f3b3f7a22d67d7f5afa66bc39ee2e299cdf63e/src/objects/value-serializer.cc#117
  * it is not, strings are serialized to include the unescaped new-line value 0x0A