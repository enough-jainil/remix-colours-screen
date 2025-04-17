import { useEffect } from "react";

export function HydrationHandler() {
  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute("data-lt-installed", "true");
  }, []);

  return null;
}
