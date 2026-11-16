# Atmos — Weather Dashboard

A responsive weather dashboard built with vanilla JavaScript and Vite, powered by the **OpenWeather API**. It is designed to satisfy both the 200-point Weather Dashboard challenge and the OpenWeather Weather App Challenge.

## Features

- Search weather by city name using OpenWeather Geocoding API
- Live current weather: temperature, feels-like, condition, humidity, wind, visibility and pressure
- Five-day forecast, grouped from the 3-hour forecast data
- Loading state, invalid-city feedback, API-key errors, rate-limit handling and network error handling
- Optional browser geolocation
- Responsive layout for mobile, tablet and desktop
- API key saved in browser localStorage (not committed to the repository)

## Run locally

1. Install Node.js (LTS).
2. Download/clone this repository.
3. Open the project folder in VS Code.
4. Open the terminal and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`).
6. Click **API settings**, paste your OpenWeather API key, and save.

## Get an OpenWeather API key

Create a free account at [OpenWeather](https://home.openweathermap.org/users/sign_up), then generate an API key from your account's API keys page. New keys may take some time to activate.

The app uses:
- `https://api.openweathermap.org/geo/1.0/direct` — city name to coordinates
- `https://api.openweathermap.org/data/2.5/weather` — current weather
- `https://api.openweathermap.org/data/2.5/forecast` — five-day forecast (3-hour intervals)

## Build for production

```bash
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com/) using GitHub.
3. Select **Add New → Project**, import this repository, and keep the detected Vite settings.
4. Click **Deploy**. No environment variable is required because the app asks each visitor for their own OpenWeather key and stores it locally in their browser.
5. Open the deployed URL, add your API key under **API settings**, and test a few cities.

## Important security note

This is a client-side learning project. The API key is stored in the visitor's browser localStorage and is sent to OpenWeather from that browser. Do not put a private or paid production key into a public repository. For a production product, proxy API requests through a serverless backend and enforce usage limits.

## Suggested GitHub repository name

`atmos-weather-dashboard`
