# Data File & Folder Structure

structure for storing data on disk:

- events: `events/${firstEventId}.ev`
- commands: `commands/?????????.cq`
- workflows: `workflows/?????????.wf`
- requests: `requests/?????????.rq`
- journal: `journal/${timestamp? id?}.jnl`
- metadata: `meta/state.dat`
- checkpoint: `**/chkpoint`

Could checkpoint commands and events separately?

## Commands

* Need a "pending-only" command file to minimize scanning for commands to process
* Need a completed commands file & index to minimize scanning for completed commands
* Completed and exhausted commands can be archived after their configured retention period
* Command payload and results data stored separately? could make moving rows out of the pending command file much faster -- if every command row is the same length then new rows can be inserted into gaps left by removed rows
* aggregate metadata: stored in `agg-${name}-${pageNumber}.tbl` where pageNumber is monotonically increasing.

* 

## Events

* Event ids are strictly monotonic integers
* Event files are named with the event id of the first event in file
* Event files have a maximum number of events per file and the current file must be full before a new file is started. 
* These three constraints mean that the location of a given event by id is deterministic 
* index files: `${columnName}-${firstEventId}.idx`
* latest event id: `seq.dat`