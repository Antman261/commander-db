# Contributing

WIP: Miscellaneous ramblings about project-specific conventions

## Folder Structure

Trying a more "denonic" folder structure: https://dev.to/reggi/organizing-files-in-a-deno-module-d63

```
.
├── database: the server itself
│   ├── journal: writes journal entries to disk
│   ├── types: general types, yet to find a home
│   ├── utils: small functions / generic types with broad utility
├── client: the client, will export as node package
│   
├── testApp: an application making use of EggyDB 