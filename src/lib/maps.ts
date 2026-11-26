export type MapPlace = {
  name: string;
  address?: string;
  latitude: number | null;
  longitude: number | null;
  maps_query?: string;
};

function destination(place: MapPlace): string {
  if (place.latitude != null && place.longitude != null) {
    return `${place.latitude},${place.longitude}`;
  }
  return place.maps_query || `${place.name} ${place.address ?? ""}`.trim();
}

/**
 * A universal Google Maps link: phones open the Google Maps app when it
 * is installed, computers open Google Maps in the browser.
 */
export function googleMapsUrl(place: MapPlace): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination(place))}`;
}

export function googleDirectionsUrl(place: MapPlace): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination(place))}`;
}

/** An embeddable map (no API key needed). */
export function googleMapsEmbedUrl(place: MapPlace): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(destination(place))}&z=15&output=embed`;
}
