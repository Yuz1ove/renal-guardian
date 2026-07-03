function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function FlowConnector({ active }: { active?: boolean }) {
  return (
    <span className={classNames("node-arrow", active && "is-active")} aria-hidden="true">
      ↓
    </span>
  );
}
