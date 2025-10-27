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
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Facebook_Messenger_logo_2020.svg/2048px-Facebook_Messenger_logo_2020.svg.png"
            alt=""
            className="w-12 h-12"
          />
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
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png"
            alt=""
            className="w-14 h-14"
          />
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
