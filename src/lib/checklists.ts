export type ChecklistKey = "monsoon" | "mechanic";

export interface Checklist {
  key: ChecklistKey;
  title: string;
  blurb: string;
  serviceType: string;
  items: string[];
}

export const CHECKLISTS: Record<ChecklistKey, Checklist> = {
  monsoon: {
    key: "monsoon",
    title: "Monsoon readiness",
    blurb: "Before the rains hit: visibility, grip, electrics and water damage.",
    serviceType: "Monsoon Check",
    items: [
      "Replace worn wiper blades and top up washer fluid",
      "Test headlights, tail lights and indicators",
      "Check tyre tread depth and pressure",
      "Inspect brake pads and brake fluid",
      "Test battery and clean the terminals",
      "Check door and boot seals for leaks",
      "Clean the air filter and note the air intake height",
      "Check the underbody and exhaust for rust and damage",
      "Test the AC and demister so the windscreen clears fast",
    ],
  },
  mechanic: {
    key: "mechanic",
    title: "Mechanic safety check",
    blurb: "For roadside, Saddar and plaza workshops: protect yourself from swapped parts and surprise bills.",
    serviceType: "Mechanic Check",
    items: [
      "Photograph the odometer and engine bay before handing over",
      "Agree the price and job list in a message before work starts",
      "Ask for the old parts back",
      "Note brand and batch of every new part fitted",
      "Watch oil and coolant being poured from a sealed bottle",
      "Remove documents and valuables from the vehicle",
      "Check the spare wheel, jack and tool kit are still there",
      "Take a short test drive before paying",
    ],
  },
};
