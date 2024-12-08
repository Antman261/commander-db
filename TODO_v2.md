# Vertical Slice Implementation Plan

**Commands & Events**

- [ ] issue a command, save it to disk
- [ ] dispatch a command for processing
- [ ] return events as command result: command marked as completed
- [ ] return events as command result: events saved
- [ ] throw error during command processing: command re-attempted
- [ ] command processing attempts exhausted: command marked as exhausted
- [ ] command processing interrupted: processing recovers using stack frames

**Event Subscribers**

- [ ] subscribed from prior event: receive saved events since
- [ ] subscribed from prior event: receive new events after event replay

**Workflows**

- [ ] start a workflow
- [ ] complete a workflow
- [ ] issue a command inside a workflow
- [ ] receive result of command inside a workflow
- [ ] use the result of command to issue subsequent command


**Archiving**

- [ ] archive completed commands to s3/gcs
- [ ] save a checkpoint, then archive journal entries to s3/gcs
- [ ] as client, set an event archival point; events prior to archival point are archived in s3/gcs

**Telemetry**

- [ ] 

## In Progress: Issue a command, save it to disk

- [ ] mocked: request from client
- [ ] translation layer: transform and validate schema
- [ ] auth: setup jwt verification middleware, but with a mock signature verification that always passes
- [ ] application instance tracking: application registered
- [ ] issueCommandMessage business logic validation: no existing command, no matching idempotency key
- [ ] journal entry written: command saved to disk