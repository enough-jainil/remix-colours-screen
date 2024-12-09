import type { MetaFunction } from "@remix-run/node";
import ColorScreensaver from "~/components/ColorScreensaver";

export const meta: MetaFunction = () => {
  return [
    { title: "Color Screensaver - Dynamic Color Changing App" },
    {
      name: "description",
      content:
        "Experience a dynamic color changing screensaver that enhances your workspace.",
    },
    {
      name: "keywords",
      content: "screensaver, color changing, dynamic colors, web app",
    },
    { name: "robots", content: "index, follow" },
  ];
};

export default function Index() {
  return <ColorScreensaver />;
}
