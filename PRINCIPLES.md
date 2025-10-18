# Design Principles For CommanderDB

* Prescriptive Simplicity: Prioritize eliminating complexity via opinionated and prescriptive design over flexibility and configurability. E.g. relinquishing control of command processing coordination to CommanderDB facilitates an extreme reduction in complexity for both the application and the database. 
* Database Complexity Over Application Complexity: Extract complexity from the application, moving it into the database.
* Opaque Physical Boundaries: Processes should not need to know if they are running on the same physical hardware, IPC could occur over unix socket or network socket it should not leak beyond the network layer. This includes client communication: if the client application is running on the same physical hardware as the database instance it should/could transparently use unix sockets instead of TCP. (not sure I actually care about this)

## Empowering Limitations:

* Only possible to write events, commands, requests, and start workflows
* Events can only be inserted during command handling
* Requests can only be made within a workflow
* Commands can be issued at any time except during command handling
* Duplicate commands issued within the retention period return the previous result
* Trying to start a running workflow subscribes to its progress
* Trying to start a completed workflow returns its events and results

The application cannot query for commands or workflows to handle! it can only subscribe to process them, allowing CommanderDB to handle transactions automatically.