import { SmallIntU } from "../primitive/SmallIntU.ts";
import { ValueOf } from "../../util/ValueOf.ts";

/**
 * A particular client application instance. Tracked both for transaction management and Skuos: Inevitable.
 */
export type AppInstance = {
  id: SmallIntU;
  status: AppInstStatusEnum;
  checkIns: AppInstCheckIns;
  /**
   * Supplied by the client, the commit hash is used to track the the application's code version. Used only for Skuos: Inevitable to detect when an inevitable function is re-attempted on a different application vision.
   */
  commitHash: string; // should probably store as number
};

export const appInstanceStatus = {
  /**
   * The application is running and can be sent commands and workflows to handle.
   */
  active: 0,
  /**
   * The application is trying to shutdown. Allow pending tasks to finish, continue dispatching events, but do not dispatch commands or workflows.
   */
  exiting: 1,
  /**
   * The application has exited. Reallocate any outstanding tasks.
   */
  exited: 2,
  /**
   * The application has gone missing. Do not accept any events from this instance, send it a missing message, and reallocate any outstanding tasks.
   */
  missing: 3,
} as const;

type AppInstStatus = typeof appInstanceStatus;
type AppInstStatusEnum = ValueOf<AppInstStatus>;

/**
 * A tuple containing the Date of two check-ins made by an app instance:
 *
 * * its first check-in
 * * its most recent check-in
 */
type AppInstCheckIns = [Date, Date];
