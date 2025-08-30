# Database Journaling

In the context of databases, a journal (AKA write-ahead-log (WAL)) is a log of all operations the database will or has performed. The primary advantage of database journaling is allowing the database application to write a journal (log) of changes it would make without physically performing several updates on disk. Instead, it writes a single journal entry describing the update and then a decoupled subsystem of the database reads the journal entries from disk and applies the updates to a virtualized in-memory file system. 

In a relational database, this is a significant optimization; it is much faster to write an append-only log to disk than it is to update many files on disk.

## CommanderDB is a command-driven event-sourced database, what does that mean?

To date, all operational transactional databases have implemented atomicity, consistency, isolation, and durability ([ACID](https://en.wikipedia.org/wiki/ACID)) guarantees by implementing transaction isolation using techniques such as Multi-Version Concurrency Control (MVCC). In these systems, 

* the application defines the scope of a transaction, informing the database of a transaction's beginning and end
* the database cannot know the final scope of a transaction until receipt of the application's COMMIT message
* the database must support multiple independent application instances each running their own isolated transactions

In these traditional systems, the application is responsible for defining the transaction boundary. But consider, what are most applications trying to achieve? Users of the system issue a command requesting a change, the application determines the outcome of the command and updates the database accordingly. Ideally, any sequence of commands should produce a deterministic and repeatable outcome. This can fail in two important ways:

1. Concurrent updates: Attempting to process two commands concurrently for the same entity instance, e.g. two commands updating one account
2. Non-deterministic command sequencing: Command A is issued before Command B, but Command B is completed first

Database Transactions are the prevailing, and ineffective, solution to these problems.

### What CommanderDB does differently

Instead of the application controlling the database's transactions, CommanderDB dispatches a queue of commands to waiting application instances, thereby inverting control. The application issues commands, CommanderDB saves them, and despatches them sequentially. The primary result of a command is one or more events, which CommanderDB saves in an append-only log called an event store.

Instead of producing a WAL indicating which bytes to update in which file, CommanderDB's WAL tracks the activities of every command. In this way, transactional concerns evaporate. This significantly improves the performance, reliability, and throughput of any application.

It also provides a significantly simpler programming model. Applications are easier to implement and reason about. From this foundation, a durable execution framework becomes trivial to implement.

## Is journaling useful for CommanderDB as a command-driven event-sourced database?

What operations will CommanderDB perform?
 
- commands will be received (saved to disk)
- commands will be started (commands do not always begin immediately once received)
- commands will be completed (completed commands will contain events)
- commands will be marked as failed
- commands will be re-attempted (alias for command started)
- event streams will be created
- events will be appended to an event stream
- event streams will be migrated to new schemas (event migration will cause a full rewrite of the event stream files)
- event streams will be archived (maybe?)
- latest event per aggregate instance will be updated (why would this be necessary now?)
- idempotency keys will be saved
- idempotency keys will expire
- idempotency keys will be deleted
- workflows will be started
- workflows will be completed
- workflows will be resumed
- workflows will be marked as failed
- requests " "
- checkpoints will be saved to disk (fsync-ed)
- journal entries will be saved to OS (not fsync-ed)
- journal entries will be saved to disk (fsync-ed)
- Stale journal entries will be archived & deleted from disk
- aggregate instances will be assigned (locked) to application instances for processing -- all pending commands for an aggregate instance can be sent to an application to optimize for processing over network
- aggregate instance can be unassigned from an application instance
- application instances will have their lastSeenAt updated
- application instances will be deregistered

Now that we have a list of operations, we can consider which operations are atomically bound, that is, they must not occur independently and would benefit from being written in the same journal entry:

- command received: application instance seen; (idempotency key saved); (command started); (workflow updated);
- command started: aggregate instance assigned to application instance; (workflow started?); (workflow updated);
- command completed: events appended to stream; aggregate instance latest event updated; application instance seen; (workflow completed); (workflow updated); (event stream started); (aggregate instance unassigned from application instance);
- command failed: (workflow failed); (aggregate instance unassigned from application instance); (application instance deregistered);
- workflow started; aggregate instance assigned to application instance;
- workflow failed; (aggregate instance unassigned from application instance); (application instance deregistered);
- workflow completed; application instance seen; (aggregate instance unassigned from application instance);
- request started; workflow updated;
- request completed; workflow updated;
- request failed; workflow failed; (aggregate instance unassigned from application instance); (application instance deregistered);
- checkpoint started;
- checkpoint completed;

We could think of the journal as a stream of redux actions with each child process receiving the same stream of actions. This allows child processes to share state without any risk of memory corruption. However, since there is only one process writing general entries we could have one process reading those journal entries and applying them to a shared memory buffer. This would also prevent memory corruption.

## Benefits of Journaling

Implementing a database journal enables reads to be scaled horizontally. It works well with worker threads, since threads aren't allowed to share memory in ~~Node~~ Deno.

## Inspiration From Postgres

- Postgres does not flush every WAL entry disk
- https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-INIT-ZERO
- https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-WRITER-DELAY
- https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-WRITER-FLUSH-AFTER
- https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-SKIP-THRESHOLD
- https://www.postgresql.org/docs/current/runtime-config-wal.html#RUNTIME-CONFIG-WAL-CHECKPOINTS
- checkpoints flush all dirty data pages to disk -- making it safe to delete WAL files prior to the checkpoint https://www.postgresql.org/docs/current/wal-configuration.html
-

## Misc

- https://stackoverflow.com/a/21735886/2935062 SSD performance https://superuser.com/a/1344713
- instead of deleting archived WAL, copy it to GCS/s3 -- this becomes a point-in-time backup
- random idea: what if the application instances consumed the WAL and ran the database in replication mode? then they wouldn't need to query anything, because they are effectively running the database in memory, when they see a journal entry assigning a command to their instance, they would begin processing, generate the draft-WAL in memory, and send it back to the database to "commit" their transaction
  - the database could be selective about WAL entries it sends to applications -- only "command completed" entries for commands not assigned to the application instance
  - why bother making a distinction between application and database? if every application instance is receiving every command and running as a replica, then the application instances are also failover database instances.
  - application and database could communicate over IPC on the same machine to provide isolation, divide resources (especially CPU), and avoid blocking each other's event loop or corrupting memory
