/**
 * Anything that identifies an instant: a `Date`, epoch milliseconds, an ISO string, or a
 * Temporal value that exposes `epochMilliseconds` (`Temporal.Instant`, `Temporal.ZonedDateTime`).
 */
export type DateInput = Date | number | string | { readonly epochMilliseconds: number }

/** Epoch milliseconds for `input`, or `NaN` when it does not describe a valid instant. */
export function toEpochMs(input: DateInput): number {
  if (typeof input === 'number') return input
  if (typeof input === 'string') return Date.parse(input)
  if (input instanceof Date) return input.getTime()
  return input.epochMilliseconds
}

export function toValidEpochMs(input: DateInput, name: string): number {
  const ms = toEpochMs(input)
  if (!Number.isFinite(ms)) throw new RangeError(`Invalid ${name}: ${String(input)}`)
  return ms
}
