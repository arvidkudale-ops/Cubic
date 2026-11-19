export function IconButton({ children, label, className = '', ...props }) {
  return <button className={`icon-btn ${className}`} title={label} aria-label={label} {...props}>{children}</button>;
}

export function TextButton({ children, tone = '', className = '', ...props }) {
  return <button className={`text-btn ${tone} ${className}`} {...props}>{children}</button>;
}

export function Field({ className = '', ...props }) {
  return <input className={`field ${className}`} {...props} />;
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="card w-full max-w-3xl p-5" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <TextButton onClick={onClose}>Close</TextButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 text-sm">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="h-7 w-12 rounded-full p-1" style={{ background: checked ? 'var(--accent)' : 'rgba(255,255,255,.12)' }}>
        <span className="block h-5 w-5 rounded-full bg-white transition" style={{ transform: checked ? 'translateX(20px)' : 'none' }} />
      </button>
    </label>
  );
}

export function Slider({ label, min, max, step = 1, value, onChange, suffix = '' }) {
  return (
    <label className="block py-2 text-sm">
      <span className="mb-1 flex justify-between text-[var(--muted)]"><span>{label}</span><span>{value}{suffix}</span></span>
      <input className="w-full accent-[var(--accent)]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function Empty({ children }) {
  return <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">{children}</div>;
}
