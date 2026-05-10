import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/style.css";
import "./styles/dropdown.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

window.addEventListener("DOMContentLoaded", () => {

  const map = L.map("map").setView([44.3, 23.8], 13);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png").addTo(map);

  let userLocation = null;
  let userCircle = null;

  if (!navigator.geolocation) {
    alert("Browserul tău nu suportă geolocația.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      userLocation = { lat: latitude, lng: longitude };

      map.setView([latitude, longitude], 16);

      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup("📍 Ești aici")
        .openPopup();

      userCircle = L.circleMarker([latitude, longitude], {
        radius: 10,
        color: "red",
        fillColor: "red",
        fillOpacity: 0.6,
      }).addTo(map);
    },
    (err) => {
      console.error("Geolocation error:", err);
      alert("Eroare geolocation: " + err.code + "\nProbabil Safari blochează permisiunea.");
    },
    { enableHighAccuracy: true }
  );

  map.on("click", (e) => {
    if (!userLocation) {
      alert("Nu avem locația ta încă.");
      return;
    }

    const { lat, lng } = e.latlng;
    const distance = getDistanceMeters(userLocation.lat, userLocation.lng, lat, lng);

    if (distance > 500) {
      alert("❌ Poți raporta doar în apropierea ta (max 500m).");
      return;
    }

    if (userCircle) {
      userCircle
        .setLatLng([lat, lng])
        .bindPopup("⚠️ Raportează ambrozie aici!")
        .openPopup();
    }
  });

  setTimeout(() => map.invalidateSize(), 100);

});

const btn = document.getElementById("showMenu");
const menu = document.getElementById("menu");

btn.addEventListener("click", () => {
  const isOpen = menu.classList.contains("open");

  if (!isOpen) {
    menu.style.display = "flex";
    requestAnimationFrame(() => menu.classList.add("open"));
    btn.style.backgroundColor = "#f5f5f5";
    btn.style.color = "#1a1a1a";
  } else {
    menu.classList.remove("open");
    menu.addEventListener("transitionend", () => {
      if (!menu.classList.contains("open")) menu.style.display = "none";}, { once: true });
    btn.style.backgroundColor = "#1a1a1a";
    btn.style.color = "#f5f5f5";
  }
});

function closeMenu(){
  menu.classList.remove("open");
  menu.addEventListener("transitionend", () => {if (!menu.classList.contains("open")) menu.style.display = "none"}, { once: true });
  btn.style.backgroundColor = "#1a1a1a";
  btn.style.color = "#f5f5f5";
}

function loadContent(id){
  const container = document.getElementById("display-container");
  if(id == "harta"){container.style.display="none";closeMenu();return;}
  else{container.style.display="flex";}
  container.innerHTML = "";
  if(!id)return;

  const template = document.getElementById(`t-${id}`);
  const clone = template.content.cloneNode(true);
  container.appendChild(clone);
  container.classList.add("open");
}

document.querySelectorAll("#menu div").forEach((item)=>{
  item.addEventListener('click', ()=>{
    loadContent(item.id);
    closeMenu();
  });
})