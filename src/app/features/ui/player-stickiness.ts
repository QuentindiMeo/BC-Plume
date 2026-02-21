import { BC_ELEM_IDENTIFIERS } from "../../../domain/bandcamp";
import { CPL, logger } from "../../../shared/logger";
import { getString } from "../i18n";
import type { CleanupCallback } from "../types";

const SCROLLED_CLASSNAME = "scrolled";

export const setupPlayerStickiness = (): CleanupCallback => {
  const parentDivClassName = BC_ELEM_IDENTIFIERS.playerParent.split(".")[1];
  const plumeParentDiv = document.getElementsByClassName(parentDivClassName)[0];

  if (!plumeParentDiv) {
    logger(CPL.ERROR, getString("ERROR__PLAYER_PARENT__NOT_FOUND"));
    // Return no-op cleanup if parent element not found
    return () => {};
  }

  const playerParent = plumeParentDiv as HTMLDivElement;
  const cachedOffsetTop = playerParent.offsetTop;
  let rafId: number | null = null;

  const handleScroll = () => {
    if (rafId) return; // Already scheduled

    rafId = requestAnimationFrame(() => {
      const plumeIsInViewport = window.scrollY < cachedOffsetTop;

      // classList mutation is intentionally direct here, bypassing the store.
      // Sticky state is a purely local visual concern — no other feature reads it.
      if (plumeIsInViewport) {
        playerParent.classList.remove(SCROLLED_CLASSNAME);
      } else {
        playerParent.classList.add(SCROLLED_CLASSNAME);
      }

      rafId = null;
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", handleScroll);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
};
