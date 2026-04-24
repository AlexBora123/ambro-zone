import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

window.addEventListener("DOMContentLoaded", () => {

  const map = L.map("map").setView([44.3, 23.8], 13);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap contributors © CARTO",
  }).addTo(map);

  let userLocation = null;
  let zoneLocation = null;
  let userCircle = null;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        userLocation = { lat: latitude, lng: longitude };
        zoneLocation = userLocation;
        map.setView([latitude, longitude], 16);

        var marker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("📍 Ești aici")
          .openPopup();
        marker.addEventListener("click", function func(e) {
          const { lat, lang } = e.latlng;
          userCircleserCircle
            .setLatLng([lat, lng])
            .bindPopup("⚠️ Raporteazǎ ambrozie aici!")
            .openPopup();
        });

        delete L.Icon.Default.prototype._getIconUrl;

        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIcon,
          iconUrl: markerIcon,
          shadowUrl: markerShadow,
        });

        userCircle = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 10,
          color: "red",
          fillColor: "red",
          fillOpacity: 0.6,
        });
        userCircle.addTo(map);
      },
      () => {
        alert("Trebuie să permiți locația pentru a folosi aplicația.");
      },
      {
        enableHighAccuracy: true,
      }
    );
  }
  function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log("OK:", pos.coords);
      alert("Locație funcționează");
    },
    (err) => {
      console.log("ERROR:", err);

      alert(
        "Eroare geolocation: " + err.code +
        "\nProbabil Safari blochează permisiunea."
      );
    }
  );
  map.on("click", (e) => {
    if (!userLocation) {
      alert("Nu avem locația ta încă.");
      return;
    }

    const { lat, lng } = e.latlng;

    const distance = getDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      lat,
      lng
    );

    if (distance > 500) {
      alert("❌ Poți raporta doar în apropierea ta (max 500m).");
      return;
    }

    if (userCircle) {
      userCircle
        .setLatLng([lat, lng])
        .bindPopup("⚠️ Raporteazǎ ambrozie aici!")
        .openPopup();
    }
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
});