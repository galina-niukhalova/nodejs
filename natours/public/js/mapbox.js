/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZy1uaXVraGFsb3ZhIiwiYSI6ImNrOXZlOHh0NjBhcHAzZmw2ZGFkcGw0YWgifQ.0zJQQGvw7i595pwxLH1yyg';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/g-niukhalova/ck9vejw7k0zrr1iuqxg8m9d2s',
    scrollZoom: false,
    // center: [-118.6919205, 34.0201613],
    // zoom: 4,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker
    // eslint-disable-next-line no-new
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

export default {
  displayMap,
};
