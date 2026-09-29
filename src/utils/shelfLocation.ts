import { Book, BookCopy, ShelfLocationDetails } from "../types";

export interface ParsedShelfLocation extends ShelfLocationDetails {
  fullString: string;
  wayfindingDirections: string;
  bayNumber: number;
  shelfNumber: number;
  positionNumber: number;
}

export function parseShelfLocation(
  locationString?: string,
  copy?: BookCopy | null,
  book?: Book | null
): ParsedShelfLocation {
  const raw = locationString || copy?.shelfLocation || book?.shelfLocation || "Block A → Floor 1 → Rack CS-01 → Shelf 2 → Position 01";
  const parts = raw.split("→").map((s) => s.trim());

  const building = copy?.building || book?.building || parts[0] || "Block A";
  const floor = copy?.floor || book?.floor || parts[1] || "Floor 1";
  const rack = copy?.rack || book?.rack || parts[2] || "Rack CS-01";
  const shelf = copy?.shelf || book?.shelf || parts[3] || "Shelf 2";
  const position = copy?.position || book?.position || parts[4] || "Position 01";

  // Numeric extractions for visual 2D shelf grid
  const bayMatch = rack.match(/\d+/);
  const bayNumber = bayMatch ? parseInt(bayMatch[0], 10) : 1;

  const shelfMatch = shelf.match(/\d+/);
  const shelfNumber = shelfMatch ? parseInt(shelfMatch[0], 10) : 2;

  const posMatch = position.match(/\d+/);
  const positionNumber = posMatch ? parseInt(posMatch[0], 10) : 1;

  const wayfindingDirections = `${building} • ${floor} • Proceed to ${rack}, Level ${shelfNumber} (Tier ${shelf}), Slot ${String(positionNumber).padStart(2, "0")}`;

  return {
    building,
    floor,
    rack,
    shelf,
    position,
    fullString: `${building} → ${floor} → ${rack} → ${shelf} → ${position}`,
    wayfindingDirections,
    bayNumber,
    shelfNumber,
    positionNumber,
  };
}
