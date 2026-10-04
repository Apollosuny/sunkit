// Constructing Intl formatters is far more expensive than calling `format()`, and a list of
// relative timestamps re-renders every second. Cache one formatter per locale + options.
const relativeTimeFormats = new Map<string, Intl.RelativeTimeFormat>()
const dateTimeFormats = new Map<string, Intl.DateTimeFormat>()

export function getRelativeTimeFormat(
  locale: string | undefined,
  options: Intl.RelativeTimeFormatOptions
): Intl.RelativeTimeFormat {
  const key = JSON.stringify([locale ?? '', options])
  let format = relativeTimeFormats.get(key)
  if (!format) {
    format = new Intl.RelativeTimeFormat(locale, options)
    relativeTimeFormats.set(key, format)
  }
  return format
}

export function getDateTimeFormat(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const key = JSON.stringify([locale ?? '', options])
  let format = dateTimeFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options)
    dateTimeFormats.set(key, format)
  }
  return format
}
