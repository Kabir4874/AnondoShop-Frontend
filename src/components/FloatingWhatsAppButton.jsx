const FloatingWhatsAppButton = () => {
  const href = "https://wa.me/8801876694376";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="
        fixed bottom-8 right-4 z-50
        inline-flex items-center justify-center
        h-14 w-14 rounded-full
        bg-[#25D366] text-white shadow-lg
        hover:scale-105 active:scale-95 transition-transform
        focus:outline-none focus:ring-2 focus:ring-[#25D366]/40
      "
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/2062095_application_chat_communication_logo_whatsapp_icon.svg/2048px-2062095_application_chat_communication_logo_whatsapp_icon.svg.png"
        alt="whatsapp img"
      />
    </a>
  );
};

export default FloatingWhatsAppButton;
