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
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let userLocation = null;
let userCircle = null;
const map = L.map("map").setView([44.3, 23.8], 13);

window.addEventListener("DOMContentLoaded", () => {

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  ).addTo(map);


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
      alert("Eroare geolocation: " + err.code + "\nGeolocație invalidǎ!.");
    },
    { enableHighAccuracy: true },
  );

  map.on("click", (e) => {
    if (!userLocation) {
      alert("Nu avem locația ta încă.");
      return;
    }
    const { lat, lng } = e.latlng;
    const distance = getDistanceMeters(userLocation.lat, userLocation.lng, lat, lng);
    if (distance > 200) {
      alert("❌ Poți raporta doar în apropierea ta (max 200).");
      return;
    }
    if (userCircle) {
      userCircle.setLatLng([lat, lng]).bindPopup("⚠️ Raportează ambrozie aici!").openPopup();
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
      if (!menu.classList.contains("open")) menu.style.display = "none";
    }, { once: true });
    btn.style.backgroundColor = "#1a1a1a";
    btn.style.color = "#f5f5f5";
  }
});

function closeMenu() {
  menu.classList.remove("open");
  menu.addEventListener("transitionend", () => {
    if (!menu.classList.contains("open")) menu.style.display = "none";
  }, { once: true });
  btn.style.backgroundColor = "#1a1a1a";
  btn.style.color = "#f5f5f5";
}

async function getData() {
  const lat = 44.3167;
  const lon = 23.8;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=ragweed_pollen,grass_pollen,pm10&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,rain&timezone=auto`;

  try {
    const [airRes, weatherRes] = await Promise.all([fetch(airUrl), fetch(weatherUrl)]);
    const airData = await airRes.json();
    const weatherData = await weatherRes.json();
    const now = new Date();

    return {
      locatie: "Craiova, România",
      data: now.toLocaleDateString("ro-RO"),
      luna: now.toLocaleString("ro-RO", { month: "long" }),
      sezon:
        now.getMonth() >= 2 && now.getMonth() <= 4 ? "primăvară"
        : now.getMonth() >= 5 && now.getMonth() <= 7 ? "vară"
        : now.getMonth() >= 8 && now.getMonth() <= 10 ? "toamnă"
        : "iarnă",
      ambrozie: airData.current.ragweed_pollen ?? 0,
      polen: airData.current.grass_pollen ?? 0,
      pm10: airData.current.pm10 ?? 0,
      temperatura: weatherData.current.temperature_2m ?? null,
      umiditate: weatherData.current.relative_humidity_2m ?? null,
      vant: weatherData.current.wind_speed_10m ?? null,
      precipitatii: weatherData.current.precipitation ?? 0,
      ploaie: weatherData.current.rain ?? 0,
    };
  } catch (error) {
    console.error("Eroare context expert:", error);
    return null;
  }
}

function getStatus(value) {
  if (value === 0) return { icon: "✓", label: "Aer Curat", class: "low", color: "#4CAF50" };
  else if (value > 0 && value <= 10) return { icon: "⚠", label: "Risc Scăzut", class: "med", color: "#FF9800" };
  else if (value > 10) return { icon: "☠", label: "Risc Mediu", class: "high", color: "#F44336" };
  else return { icon: "?", label: "Date insuficiente", class: "unknown", color: "#8b8888" };
}

const monthNames = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

async function getCalendar() {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=44.3167&longitude=23.8000&hourly=ragweed_pollen&timezone=auto`;

  if (!dateMeteoCaptate) dateMeteoCaptate = await getData();
  const raspuns = await askGroq("Care este riscul pentru mine azi?", true);

  const chatWindow = document.getElementById("chat-window");
  if (chatWindow) {
    chatWindow.innerHTML += `<div class="msg bot"><div class="card">${raspuns}</div></div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  const response = await fetch(url);
  const data = await response.json();

  const hourlyValues = data.hourly.ragweed_pollen;
  const dailyAverages = [];
  for (let i = 0; i < hourlyValues.length; i += 24) {
    const oZi = hourlyValues.slice(i, i + 24);
    dailyAverages.push(Math.max(...oZi));
  }
  return dailyAverages;
}

async function initCalendarFeatures() {
  const prognozaSaptamana = await getCalendar();
  const grid = document.getElementById("calendar-grid");

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const nrDays = new Date(currentYear, currentMonth, 0).getDate();

  document.getElementById("month-name").textContent =
    `${currentDay} ${monthNames[today.getMonth()]} ${currentYear}`;

  for (let i = currentDay; i <= nrDays; i++) {
    const day = document.createElement("div");
    let valoarePolen = i <= prognozaSaptamana.length ? prognozaSaptamana[i - 1] : 0;
    if (i == currentDay) day.style.borderColor = "black";
    if (!(i >= currentDay && i < currentDay + prognozaSaptamana.length)) valoarePolen = -1;
    const status = getStatus(valoarePolen);
    day.className = `day ${status.class}`;
    day.innerHTML = `<span class="day-number">${i}</span><span class="day-icon">${status.icon}</span>`;
    grid.appendChild(day);
  }
}
let dateMeteoCaptate = null;

async function askGroq(prompt, estePrimul = false) {
  try {
    const res = await fetch("/api/ai-chat", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        contextData: dateMeteoCaptate,
        estePrimul,
      }),
    });

    if (!res.ok) throw new Error("Server response error");
    
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.error("Frontend AI Error:", err);
    return "Momentan nu pot comunica cu expertul AI.";
  }
}

async function handleSend() {
  const input = document.getElementById("chat-input");
  const userText = input.value.trim();
  if (!userText) return;

  input.value = "";

  const chatWindow = document.getElementById("chat-window");
  chatWindow.innerHTML += `<div class="msg user"><div class="card">${userText}</div></div>`;
  chatWindow.innerHTML += `<div class="msg bot" id="typing"><div class="card">...</div></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (!dateMeteoCaptate) dateMeteoCaptate = await getData();

  const reply = await askGroq(userText, false);

  document.getElementById("typing")?.remove();
  chatWindow.innerHTML += `<div class="msg bot"><div class="card">${reply}</div></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function initChatListeners() {
  const sendBtn = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  if (sendBtn) sendBtn.addEventListener("click", handleSend);
  if (input) input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
}

function loadContent(id) {
  const container = document.getElementById("display-container");
  if (id == "harta") {
    container.style.display = "none";
    closeMenu();
    return;
  } else {
    container.style.display = "flex";
  }
  container.innerHTML = "";
  if (!id) return;

  const template = document.getElementById(`t-${id}`);
  const clone = template.content.cloneNode(true);
  container.appendChild(clone);
  container.classList.add("open");

  if (id === "calendar") {
    initCalendarFeatures();
    initChatListeners();
  }
}

document.querySelectorAll("#menu div").forEach((item) => {
  item.addEventListener("click", () => {
    loadContent(item.id);
    closeMenu();
  });
});

const CRAIOVA_BOUNDS = {
  latMin: 44.2700, 
  latMax: 44.3700, 
  lngMin: 23.7300, 
  lngMax: 23.8800  
};

function isInsideCraiova(lat, lng) {
  return lat >= CRAIOVA_BOUNDS.latMin && 
         lat <= CRAIOVA_BOUNDS.latMax && 
         lng >= CRAIOVA_BOUNDS.lngMin && 
         lng <= CRAIOVA_BOUNDS.lngMax;
}



async function loadReportsOnMap() {
  try {
    const response = await fetch("/api/reports");
    const reports = await response.json();

    reports.forEach((report) => {
      L.circle([report.lat, report.lng], {
        radius: 20, 
        color: "green",
        fillColor: "#2ecc71",
        fillOpacity: 0.5
      })
      .addTo(map)
      .bindPopup(`Ambrozie confirmată la data de: ${new Date(report.timestamp?.seconds * 1000).toLocaleDateString()}`);
    });
  } catch (error) {
    console.error("Nu am putut încărca raportările:", error);
  }
}

const reportBtn = document.getElementById("report-btn");

const modal = document.getElementById("captcha-modal");
const confirmBtn = document.getElementById("confirm-report");
const cancelBtn = document.getElementById("cancel-report");
reportBtn.addEventListener("click", () => {
  if (!userCircle) {
    alert("Te rugăm să alegi o locație pe hartă mai întâi!");
    return;
  }
  modal.style.display = "flex";
});

cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
  grecaptcha.reset(); 
});

confirmBtn.addEventListener("click", async () => {
  const captchaToken = grecaptcha.getResponse();
  if (!captchaToken) return alert("Bifează căsuța CAPTCHA!");

  const { lat, lng } = userCircle.getLatLng();

  if (!isInsideCraiova(lat, lng)) {
    alert("Ne pare rău! Momentan acceptăm raportări doar pentru municipiul Craiova.");
    modal.style.display = "none";
    return;
  }

  try {
    const checkRes = await fetch("/api/reports");
    const existingReports = await checkRes.json();
    const isDuplicate = existingReports.some(report => 
      report.lat.toFixed(5) === lat.toFixed(5) && 
      report.lng.toFixed(5) === lng.toFixed(5)
    );

    if (isDuplicate) {
      modal.style.display = "none";
      grecaptcha.reset(); 
      alert("⚠️ Există deja o raportare în acest punct exact!");
      return; 
    }

    confirmBtn.innerText = "Se trimite...";
    confirmBtn.disabled = true;

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, captchaToken })
    });

    if (response.ok) {
      modal.style.display = "none";
      grecaptcha.reset(); 
      alert("Bravo! Alerta a fost salvată pe hartă.");
      modal.style.display = "none";
      grecaptcha.reset();
      loadReportsOnMap(); 
    } else {
      alert("Eroare la trimitere. Reîncearcă.");
    }
  } catch (error) {
    console.error("Eroare:", error);
    alert("A apărut o problemă la comunicarea cu serverul.");
  } finally {
    confirmBtn.innerText = "Confirmă și Trimite";
    confirmBtn.disabled = false;
  }
});
loadReportsOnMap();