import { toValidEpochMs, type DateInput } from './date-input'

export interface ServerOffsetSample {
  /** The time the server reported, e.g. from a response body or the `Date` header. */
  serverTime: DateInput
  /** Local `Date.now()` just before the request was sent. */
  requestStart: number
  /** Local `Date.now()` right after the response arrived. */
  requestEnd: number
}

/**
 * Estimates `serverClock - localClock` in milliseconds from one request, assuming the server
 * stamped its time halfway through the round trip (the NTP midpoint assumption). Pass the
 * result to `setServerTimeOffset()`.
 *
 * @throws RangeError when `serverTime` is not a valid instant.
 */
export function estimateServerOffset({ serverTime, requestStart, requestEnd }: ServerOffsetSample): number {
  return Math.round(toValidEpochMs(serverTime, 'serverTime') - (requestStart + requestEnd) / 2)
}
