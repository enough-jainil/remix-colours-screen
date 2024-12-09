import { useEffect } from "react";

export function HydrationHandler() {
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (htmlElement.hasAttribute("data-lt-installed")) {
      htmlElement.setAttribute("data-lt-installed", "true");
    }
  }, []);

  return null;
}