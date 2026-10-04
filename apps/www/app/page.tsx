import Link from "next/link"

const PACKAGES = [
  {
    href: "/docs/react-middle-truncate",
    name: "@sunkitjs/react-middle-truncate",
    description: "Pixel-accurate middle ellipsis for addresses, hashes and file names.",
  },
  {
    href: "/docs/react-time",
    name: "@sunkitjs/react-time",
    description: "Hydration-safe relative time, local time and countdowns on one shared clock.",
  },
]

export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">sunkit</h1>
        <p className="text-muted-foreground">
          React UI building blocks: headless npm packages and a shadcn registry.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Packages</h2>
        <ul className="flex flex-col gap-2">
          {PACKAGES.map((pkg) => (
            <li key={pkg.href}>
              <Link
                href={pkg.href}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="font-mono text-sm font-medium">{pkg.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {pkg.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
