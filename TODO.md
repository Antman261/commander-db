# High Level Plan

* [ ] Journal Manager
* [ ] Virtualized Page Tables 
* [ ] Page Table Sync (Flush)
* [ ] Sequence Generator
* [ ] Event Writer
* [ ] Command Manager
* [ ] Request and Response Messaging
* [ ] Inter-process Messaging
* [ ] Client-server Messaging
* [ ] Authentication (basic: 3 default users, password via env var)
* [ ] Authorization (admin, write, read)
* [ ] Subscription Dispatcher
* [ ] Query Resolver

## Journal Manager

* Need to write journal entries to journal pages
* Need to ensure only one process is writing: lock with process id? fs advisory lock?
* Need to ensure fsync before emitting entry event

Questions:

* do I need to virtualize files or can I just worry about the data itself and the materialization process can figure out where the changes should go?
  * will allow files to be different sizes. a file could just contain serialized data
  * could maintain an index inside each file containing the byte offset of each row?
  * then we don't need to read the whole file to get a subset of rows
  * we won't update rows in a way that would change their size, so we don't need to worry about updates overwriting another row's data
  * **Conclusion:** We virtualize page table data, but not its metadata. The Materializer can write the page table headers

a journal entry needs

* the file the change relates to
* the type of change
* the changed data
* metadata about the client (for inevitable)

there is a limited number of change types:

* command issued (can contain workflow data)
* command started (locks an aggregate) (can contain workflow data)
* command continued (callstack stackframe result)
* command failed 
* command completed (contains events)
* workflow started
* workflow continued (callstack stackframe result)
* workflow: request started
* workflow: request failed
* workflow: request completed

during the transaction we could create a DraftJournalEntry that would exclude file information. to complete the transaction, we pass the DraftJournalEntry[] to the Journaler, which will enrich the entries with file data. 