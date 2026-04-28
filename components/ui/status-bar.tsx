// Faux iOS status bar shown only on mobile. Hidden on md+.
export function StatusBar() {
  return (
    <div className="md:hidden flex justify-between items-center px-6 pt-3 pb-1 text-[13px] font-medium text-stone-200/90 tracking-tight">
      <span>9:41</span>
      <div className="flex gap-1 items-center">
        <span className="text-[10px]">●●●●</span>
      </div>
    </div>
  );
}
