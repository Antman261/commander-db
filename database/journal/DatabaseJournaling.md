# Database Journaling

In the context of databases, a journal (AKA write-ahead-log (WAL)) is a log of all operations the database will or has performed. The primary advantage of database journaling is that it allows a database application to write a journal (log) of changes it would make without actually performing those updates on disk. In a relational database, this is a significant optimization; it is much faster to write an append-only log to disk than it is to update many files on disk.

## Is journaling useful for EggyDB as an event-based database?

event sourcing takes inspiration from the journaling approach implemented by databases, so it's worth considering if a database journal would be redundant in an event sourcing database. 

What operations will EggyDB perform, and what extra information could each journal entry contain that wouldn't otherwise be stored?

* commands will be received (saved to disk)
  * command id 
* commands will be started (commands may not begin immediately after being received due to pre-existing commands in the queue)
* commands will be completed
  * completed commands will/could contain events -- events could exist in journal before being saved to disk
* commands will be marked as failed
* commands will be re-attempted
* workflows will be started
* workflows will be completed
* workflows will be resumed
* workflows will be marked as failed
* callstacks " " 
* workflows " "
* callstacks " "
* checkpoints will be saved to disk (fsync-ed)
* journal entries will be saved to OS   (not fsync-ed)
* journal entries will be saved to disk (fsync-ed)

we could think of the journal as a stream of redux actions, and each child process he received the same stream of actions

## Benefits of Journaling

Implementing a database journal enables reads to be scaled horizontally. It works well with worker threads, since threads aren't allowed to share memory in ~Node~ Deno.

## Inspiration From Postgres

* Postgres does not flush every WAL entry disk
* https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-INIT-ZERO
* https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-WRITER-DELAY
* https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-WRITER-FLUSH-AFTER
* https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-SKIP-THRESHOLD
* https://www.postgresql.org/docs/current/runtime-config-wal.html#RUNTIME-CONFIG-WAL-CHECKPOINTS
* checkpoints flush all dirty data pages to disk -- making it safe to delete WAL files prior to the checkpoint https://www.postgresql.org/docs/current/wal-configuration.html
* 

## Misc

* https://stackoverflow.com/a/21735886/2935062 SSD performance
https://superuser.com/a/1344713