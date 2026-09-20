export default function FormulaSheet({ html }: { html: string }) {
  return (
    <details className="group rounded-3xl border border-pf-border bg-pf-surface p-6 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold text-pf-text transition-colors group-open:text-pf-primary">
        Formula sheet &amp; the 4 reflexes
      </summary>
      <div
        className="prose-sheet mt-5 text-sm text-pf-icon [&_code]:font-mono [&_code]:text-xs [&_code]:text-pf-text [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-pf-primary-dark [&_h4:first-child]:mt-0 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border-b [&_td]:border-pf-border [&_td]:py-1.5 [&_td]:pr-3 [&_td:first-child]:text-pf-icon"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </details>
  );
}
