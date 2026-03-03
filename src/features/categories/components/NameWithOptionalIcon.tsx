interface Props {
  name: string;
  icon?: string | null;
}

export function NameWithOptionalIcon({ name }: Props) {
  // TODO: render icon when icon library is configured
  return <span>{name}</span>;
}
