* https://www.postgresql.org/docs/current/wal-reliability.html
* check sums for journal page entries
* https://docs.deno.com/examples/data_processing/ -- partition might be useful for splitting collections by status, e.g. pending commands?
* https://qwtel.com/posts/software/how-to-serialize-a-javascript-object/


Tb?
* https://book.mixu.net/distsys/time.html
* https://lamport.azurewebsites.net/pubs/time-clocks.pdf
* https://www.infoq.com/presentations/redesign-oltp/
* https://spinroot.com/gerard/pdf/P10.pdf
* https://jimgray.azurewebsites.net/papers/ameasureoftransactionprocessingpower.pdf
* https://www.microsoft.com/en-us/research/wp-content/uploads/2005/04/tr-2005-39.pdf
* http://pmg.csail.mit.edu/papers/vr-revisited.pdf
  * If you can guarantee that every request from clients to the database will be retried if not successfully acknowledged (you can), is there still a need for Viewstamp Replication?
  * Obviously some replication is needed, and a predetermined failover makes sense, but why wait for a quorum to know about the client request before executing it? If the primary fails and we failover, the client can resubmit their request? Doesn't this achieve the same outcome?
  * 