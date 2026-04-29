import { SectionLabel } from "./section-label";

export function ScreenHeader({
  left,
  label,
  right,
}: {
  left?: React.ReactNode;
  label?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-2">
      {left ?? <div className="w-9 h-9" />}
      {label && <SectionLabel>{label}</SectionLabel>}
      {right ?? <div className="w-9 h-9" />}
    </div>
  );
}
