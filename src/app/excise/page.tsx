import ExciseView from "@/components/ExciseView";

// A static shell with no personal data in the HTML, so the service worker can safely keep it for offline use.
export default function ExcisePage() {
  return <ExciseView />;
}
