export function AppFooter() {
  return (
    <footer className="py-4 px-4 sm:px-6 text-center border-t border-white/[0.06] bg-black/20 backdrop-blur-sm mt-auto">
      <div className="flex flex-col items-center gap-1">
        <span className="text-white/30 text-sm">
          Powered by{" "}
          <span className="font-semibold text-[#D4AF37]/60">SmartGenEduX</span>
          {" "}@ 2026
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/15">Prashnakosh Beta</span>
      </div>
    </footer>
  );
}
