export function Footer() {
  // getFullYear() reads the real current year every time this
  // renders — nothing to update by hand each January.
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto pt-8 pb-6 text-center">
      <p className="font-mono text-[11px] text-ink/35">
        © {year} SUIBING IT SERVICES
      </p>
    </footer>
  );
}
