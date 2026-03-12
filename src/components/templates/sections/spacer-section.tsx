interface SpacerSectionProps {
  height?: string;
}

export function SpacerSection({ height = "4rem" }: SpacerSectionProps) {
  return <div style={{ height }} aria-hidden="true" />;
}
