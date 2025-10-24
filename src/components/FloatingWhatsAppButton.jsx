import { useEffect, useRef, useState } from "react";

const FloatingWhatsAppButton = () => {
  // ==== Edit these in one place ====
  const PHONE = "8801876694376";
  const WHATSAPP_URL = `https://wa.me/${PHONE}`;
  const MESSENGER_URL = "https://m.me/129067706947076?source=qr_link_share";
  const CALL_URL = `tel:+${PHONE}`;
  // =================================

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Small helper to combine classes
  const cx = (...classes) => classes.filter(Boolean).join(" ");

  return (
    <div
      ref={wrapperRef}
      className="fixed right-4 bottom-6 z-50 flex flex-col items-end gap-3"
      aria-live="polite"
    >
      {/* Speed dial actions */}
      <div
        className={cx(
          "flex flex-col items-end gap-3 transition-[opacity,transform] duration-200",
          open
            ? "opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 translate-y-2"
        )}
        aria-hidden={!open}
      >
        {/* Messenger */}
        <a
          href={MESSENGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on Messenger"
          className="group inline-flex items-center gap-2"
        >
          <span className="sr-only">Messenger</span>
          <span className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white shadow hidden sm:inline-block group-hover:translate-x-[-4px] transition">
            Messenger
          </span>
          <button
            type="button"
            className="h-12 w-12 rounded-full bg-[#0084FF] text-white shadow-lg grid place-items-center hover:scale-105 active:scale-95 transition"
            title="Messenger"
          >
            {/* Messenger Icon */}
            <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current">
              <path d="M16 3C8.82 3 3 8.3 3 14.83c0 3.6 1.77 6.83 4.64 8.94V29l4.24-2.33c1.26.35 2.6.54 4.01.54 7.18 0 13-5.3 13-11.83S23.18 3 16 3zm1.02 13.85l-3.38-3.62-6.53 3.62 7.43-7.93 3.38 3.62 6.53-3.62-7.43 7.93z" />
            </svg>
          </button>
        </a>

        {/* Call */}
        <a
          href={CALL_URL}
          aria-label="Call us"
          className="group inline-flex items-center gap-2"
        >
          <span className="sr-only">Call</span>
          <span className="px-2 py-1 text-xs rounded-md bg-slate-800 text-white shadow hidden sm:inline-block group-hover:translate-x-[-4px] transition">
            Call
          </span>
          <button
            type="button"
            className="h-12 w-12 rounded-full bg-slate-900 text-white shadow-lg grid place-items-center hover:scale-105 active:scale-95 transition"
            title="Call"
          >
            {/* Phone Icon */}
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.1.37 2.28.57 3.5.57a1 1 0 011 1V21a1 1 0 01-1 1C10.85 22 2 13.15 2 2a1 1 0 011-1h3.5a1 1 0 011 1c0 1.22.2 2.4.57 3.5a1 1 0 01-.25 1.01l-2.2 2.2z" />
            </svg>
          </button>
        </a>

        {/* WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="group inline-flex items-center gap-2"
        >
          <span className="sr-only">WhatsApp</span>
          <span className="px-2 py-1 text-xs rounded-md bg-[#25D366] text-white shadow hidden sm:inline-block group-hover:translate-x-[-4px] transition">
            WhatsApp
          </span>
          <button
            type="button"
            className="h-12 w-12 rounded-full bg-[#25D366] text-white shadow-lg grid place-items-center hover:scale-105 active:scale-95 transition"
            title="WhatsApp"
          >
            {/* WhatsApp Icon */}
            <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current">
              <path d="M19.11 17.33c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.12-.41-2.14-1.31-.79-.7-1.31-1.56-1.47-1.83-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.45-.61-.45-.16 0-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.93 4.68 4.12.65.28 1.16.45 1.55.58.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM16.04 5C10.52 5 6.06 9.45 6.06 14.98c0 2.13.64 4.11 1.74 5.76L6 27l6.43-1.68a10.05 10.05 0 003.61.66c5.52 0 9.98-4.45 9.98-9.98C26.02 9.45 21.56 5 16.04 5z" />
            </svg>
          </button>
        </a>
      </div>

      {/* Main FAB */}
      <button
        type="button"
        aria-label="Open contact options"
        aria-expanded={open}
        aria-controls="contact-speed-dial"
        onClick={() => setOpen((s) => !s)}
        className={cx(
          "h-14 w-14 rounded-full grid place-items-center shadow-lg transition",
          "bg-slate-900 text-white hover:scale-105 active:scale-95 focus:outline-none",
          "focus:ring-2 focus:ring-slate-400/50"
        )}
        title={open ? "Close" : "Contact options"}
      >
        {/* Message Icon (changes to X when open) */}
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2v10z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default FloatingWhatsAppButton;
