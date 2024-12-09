import type { MetaFunction } from "@remix-run/node";
import ColorScreensaver from "~/components/ColorScreensaver";

export const meta: MetaFunction = () => {
  return [
    { title: "Color Screensaver" },
    { name: "description", content: "A dynamic color changing screensaver" },
  ];
};

export default function Index() {
  return <ColorScreensaver />;
}