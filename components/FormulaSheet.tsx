export default function FormulaSheet({ html }: { html: string }) {
  return (
    <details className="group border border-mv-border bg-mv-surface p-6">
      <summary className="cursor-pointer font-ui text-[11px] tracking-[0.2em] text-mv-dim uppercase transition-colors group-open:text-mv-blue">
        Formula sheet &amp; the 4 reflexes
      </summary>
      <div
        className="prose-sheet mt-5 text-sm text-mv-text [&_code]:font-ui [&_code]:text-xs [&_code]:text-mv-white [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:font-ui [&_h4]:text-[11px] [&_h4]:tracking-[0.14em] [&_h4]:text-mv-blue [&_h4]:uppercase [&_h4:first-child]:mt-0 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border-b [&_td]:border-mv-border [&_td]:py-1.5 [&_td]:pr-3 [&_td:first-child]:text-mv-dim"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </details>
  );
}
