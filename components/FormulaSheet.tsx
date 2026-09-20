export default function FormulaSheet({ html }: { html: string }) {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Formula sheet &amp; the 4 reflexes
      </summary>
      <div
        className="prose-sheet mt-4 text-sm text-zinc-700 dark:text-zinc-300 [&_code]:font-mono [&_code]:text-xs [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-zinc-900 dark:[&_h4]:text-zinc-100 [&_h4:first-child]:mt-0 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border-b [&_td]:border-zinc-100 dark:[&_td]:border-zinc-800 [&_td]:py-1.5 [&_td]:pr-3 [&_td:first-child]:text-zinc-500 dark:[&_td:first-child]:text-zinc-400"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </details>
  );
}
