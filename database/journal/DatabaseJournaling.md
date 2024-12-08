# Database Journaling

In the context of databases, a journal (AKA write-ahead-log (WAL)) is a log of all operations the database will or has performed. The primary advantage of database journaling is allowing the database application to write a journal (log) of changes it would make without physically performing those updates on disk. In a relational database, this is a significant optimization; it is much faster to write an append-only log to disk than it is to update many files on disk.

## Is journaling useful for EggyDB as an event-based database?

Event Sourcing takes inspiration, in part, from the journaling approach implemented by databases. So, it's worth considering if a database journal would be redundant in an event sourcing database.

What operations will EggyDB perform?

- commands will be received (saved to disk)
- commands will be started (commands do not always begin immediately once received)
- commands will be completed (completed commands will contain events)
- commands will be marked as failed
- commands will be re-attempted (alias for command started)
- event streams will be created
- events will be appended to an event stream
- event streams will be migrated to new schemas (event migration will cause a full rewrite of the event stream files)
- event streams will be archived (maybe?)
- latest event per aggregate instance will be updated
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
