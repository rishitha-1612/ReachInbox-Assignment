const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <section className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          ReachInbox
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Schedule email campaigns with confidence.
        </h1>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Sign in with Google to compose campaigns, manage senders, and track delivery.
        </p>

        <a
          className="mt-8 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          href={`${apiBaseUrl}/auth/google`}
        >
          Continue with Google
        </a>
      </section>
    </main>
  );
}
