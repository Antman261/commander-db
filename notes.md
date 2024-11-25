# Notes

## Questions, etc

* which is smaller?: 
  * a number representing a timestamp in milliseconds
  * a bigint representing a timestamp in microseconds
  * a js Date object (milliseconds tho)

* would it save space to use symbols as keys? -- it might remove string literals. negative, symbols are not serialized
  * answer: No, symbol object keys are not serialized
* could compress object keys using a map to rename keys e.g. `{ someReallyLongPropertyName: false } => { a: false }`, but this might be no more efficient than just running lz4 over the results

* small integers? store as number or as bigint? I can't remember if bigint is implemented as an array of 64 or 32 bit integers

**would it be worth implementing something like toast?:**

* would make rows identical length -- who cares, we're not going to store columnar data or anything. just would mean indexes store row number instead of byte offset -- big woop. 
* would mean additional file reads to get data for any row
* probably a waste of time

## Ideas

* could use columnar storage for some things: each column would be stored in a separate file
* because an event stream has sequential event ids we can encode the range of events contained within each file into the name of each file
* or, if we have the same number of events in each file we could name each file with the id of the first event it contains -- then we would always be able to open the right file to find an event without searching