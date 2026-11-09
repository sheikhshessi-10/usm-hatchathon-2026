import { useEffect, type RefObject } from "react";

export function useDialog(ref: RefObject<HTMLDialogElement>) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || typeof dialog.showModal !== "function") return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[aria-label="Close panel"]')?.focus();

    function keepTabInDialog(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialog?.open) return;
      const stops = Array.from(dialog.querySelectorAll<HTMLElement>(
        "button:enabled, a[href], input:enabled, select:enabled, textarea:enabled, summary, audio[controls], [tabindex]",
      )).filter(element => {
        if (element.tabIndex < 0 || !element.getClientRects().length) return false;
        for (let parent = element.parentElement; parent && parent !== dialog; parent = parent.parentElement) {
          if (parent instanceof HTMLDetailsElement && !parent.open && !parent.querySelector(":scope > summary")?.contains(element)) return false;
        }
        return true;
      });
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      if (!dialog.contains(active) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }

    document.addEventListener("keydown", keepTabInDialog);
    return () => {
      document.removeEventListener("keydown", keepTabInDialog);
      if (dialog.open) dialog.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [ref]);
}
