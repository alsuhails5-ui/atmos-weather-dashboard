import './style.css'
const API_ROOT = "https://api.openweathermap.org";
const $ = (id) => document.getElementById(id);

const state = {
  apiKey: localStorage.getItem("atmos_openweather_key") || "",
  units: "metric",
  lastCity: "Kochi",
};

const weatherEmoji = (id, icon) => {
  if (icon?.includes("雷") || (id >= 200 && id < 300)) return "⛈️";
  if (id >= 300 && id < 600) return "🌧️";
  if (id >= 600 && id < 700) return "❄️";
  if (id >= 700 && id < 800) return "🌫️";
  if (id === 800) return icon?.endsWith("n") ? "🌙" : "☀️";
  if (id === 801) return icon?.endsWith("n") ? "☁️" : "🌤️";
  if (id === 802) return "⛅";
  return "☁️";
};

const dateLabel = (date, options) =>
  new Intl.DateTimeFormat("en-IN", options).format(date);

function setNotice(message, type = "error") {
  const notice = $("notice");
  notice.textContent = message;
  notice.className = `notice ${type}`;
}

function clearNotice() {
  $("notice").className = "notice hidden";
}

function setLoading(isLoading) {
  $("loading").classList.toggle("hidden", !isLoading);
  $("searchButton").disabled = isLoading;
  $("searchButton").innerHTML = isLoading ? "Searching…" : 'Search <span>↗</span>';
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Network error. Check your internet connection and try again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) throw new Error("We couldn't find that city. Check the spelling and try again.");
    if (response.status === 401) throw new Error("Your API key is invalid or not active yet. Check API settings and try again.");
    if (response.status === 429) throw new Error("Weather service limit reached. Please wait a moment and try again.");
    throw new Error(data.message || "The weather service is temporarily unavailable. Please try again.");
  }
  return data;
}

async function getCoordinates(city) {
  const url = new URL(`${API_ROOT}/geo/1.0/direct`);
  url.searchParams.set("q", city);
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", state.apiKey);
  const places = await fetchJson(url);
  if (!places.length) throw new Error("We couldn't find that city. Try a city name with its country, like Kochi, IN.");
  return places[0];
}

async function getWeather(lat, lon) {
  const currentUrl = new URL(`${API_ROOT}/data/2.5/weather`);
  const forecastUrl = new URL(`${API_ROOT}/data/2.5/forecast`);
  for (const url of [currentUrl, forecastUrl]) {
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("appid", state.apiKey);
    url.searchParams.set("units", state.units);
  }
  const [current, forecast] = await Promise.all([fetchJson(currentUrl), fetchJson(forecastUrl)]);
  return { current, forecast };
}

function renderCurrent(data, place) {
  const weather = data.weather?.[0] || {};
  const temp = Math.round(data.main.temp);
  const high = Math.round(data.main.temp_max);
  const low = Math.round(data.main.temp_min);
  const wind = Math.round(data.wind.speed * 3.6);
  const placeName = place.name || data.name;
  const country = place.country || "";

  $("cityName").textContent = `${placeName}, ${country}`;
  $("localTime").textContent = `LOCAL TIME · ${dateLabel(new Date(Date.now() + (data.timezone || 0) * 1000), { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`;
  $("currentIcon").textContent = weatherEmoji(weather.id, weather.icon);
  $("temperature").innerHTML = `${temp}<span>°</span>`;
  $("condition").textContent = weather.description ? weather.description.replace(/\b\w/g, c => c.toUpperCase()) : "Current conditions";
  $("feelsLike").textContent = `Feels like ${Math.round(data.main.feels_like)}°`;
  $("highLow").textContent = `${high}° / ${low}°`;
  $("humidity").textContent = `${data.main.humidity}%`;
  $("wind").textContent = `${wind} km/h`;
  $("detailFeels").textContent = `${Math.round(data.main.feels_like)}°C`;
  $("detailHumidity").textContent = `${data.main.humidity}%`;
  $("detailWind").textContent = `${wind} km/h`;
  $("visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  $("pressure").textContent = `${data.main.pressure} hPa`;
  $("uvIndex").textContent = "Not provided";
}

function renderForecast(data) {
  const byDay = new Map();
  data.list.forEach((item) => {
    const day = item.dt_txt.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(item);
  });

  const days = [...byDay.entries()].slice(0, 5);
  $("forecastGrid").innerHTML = days.map(([day, items], index) => {
    const midday = items.find(item => item.dt_txt.includes("12:00:00")) || items[Math.floor(items.length / 2)];
    const min = Math.round(Math.min(...items.map(item => item.main.temp_min)));
    const max = Math.round(Math.max(...items.map(item => item.main.temp_max)));
    const label = index === 0 ? "Today" : dateLabel(new Date(`${day}T12:00:00`), { weekday: "short" });
    const icon = weatherEmoji(midday.weather?.[0]?.id, midday.weather?.[0]?.icon);
    const description = midday.weather?.[0]?.description || "—";
    return `<article class="forecast-card">
      <span class="forecast-day">${label}</span>
      <span class="forecast-icon">${icon}</span>
      <span class="forecast-condition">${description}</span>
      <div class="forecast-temps"><strong>${max}°</strong><span>${min}°</span></div>
    </article>`;
  }).join("");
}

async function searchCity(city) {
  if (!state.apiKey) {
    $("apiDialog").showModal();
    setNotice("Add your OpenWeather API key to get started.", "info");
    return;
  }
  const query = city.trim();
  if (!query) {
    setNotice("Enter a city name before searching.");
    $("cityInput").focus();
    return;
  }

  clearNotice();
  setLoading(true);
  try {
    const place = await getCoordinates(query);
    const { current, forecast } = await getWeather(place.lat, place.lon);
    renderCurrent(current, place);
    renderForecast(forecast);
    state.lastCity = query;
    $("weatherContent").classList.remove("is-stale");
  } catch (error) {
    setNotice(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

$("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  searchCity($("cityInput").value);
});

$("apiSettings").addEventListener("click", () => {
  $("apiKeyInput").value = state.apiKey;
  $("apiDialog").showModal();
});

$("apiKeyForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const key = $("apiKeyInput").value.trim();
  if (!key) return;
  state.apiKey = key;
  localStorage.setItem("atmos_openweather_key", key);
  $("apiDialog").close();
  searchCity($("cityInput").value || state.lastCity);
});

$("locationButton").addEventListener("click", () => {
  if (!navigator.geolocation) {
    setNotice("Location services are not supported by this browser.");
    return;
  }
  if (!state.apiKey) {
    $("apiDialog").showModal();
    return;
  }
  clearNotice();
  setLoading(true);
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      const { current, forecast } = await getWeather(coords.latitude, coords.longitude);
      renderCurrent(current, { name: current.name, country: current.sys.country });
      renderForecast(forecast);
      $("cityInput").value = current.name;
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }, () => {
    setNotice("Location access was unavailable. Allow location permission or search for a city.");
    setLoading(false);
  }, { timeout: 10000 });
});

$("todayDate").textContent = dateLabel(new Date(), { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
if (state.apiKey) {
  searchCity("Kochi");
} else {
  setNotice("Welcome to Atmos. Add your free OpenWeather API key to see live conditions.", "info");
  $("apiDialog").showModal();
}
