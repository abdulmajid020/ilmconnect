# IlmConnect 🕌

**IlmConnect** is a modern, verified Islamic education platform connecting Ghanaian learners with certified scholars, madrassas, and physical study hubs.

---

## 🏗 Architecture

| Layer | Technology |
|---|---|
| **Mobile App** | React Native, Expo SDK 58, Expo Router, NativeWind (Tailwind CSS v3) |
| **Interactive Map** | Leaflet / OpenStreetMap via `react-native-webview` (Zero native C++ dependencies) |
| **Backend API** | Go 1.23+, Chi router, `pgxpool`, JWT authentication |
| **Database** | PostgreSQL on Neon |
| **Spatial Engine** | **PostGIS** with GiST indexes (`ST_DWithin` radius discovery) |

---

## 🌟 Key Features

- **Spatial Scholar Discovery**: PostGIS radius search (5km, 10km, 20km, 50km) for finding verified teachers near your location.
- **Interactive Map**: View nearby scholars on an interactive map, inspect teaching centers, and request 1-on-1 lessons.
- **Role-Based Portals**:
  - **Learner Portal**: Prayer times, Quran/Tajweed discovery, 1-on-1 scholarly booking, Fatwa Q&A desk.
  - **Teacher Hub**: Manage physical teaching hubs (Madrassa, Mosque, Islamic Centre), publish classes, host Google Meet live circles.
- **AMOLED Dark Mode**: Clean modern aesthetic with Samsung OneUI typography.

---

## 🚀 Getting Started

### Backend
```bash
cd backend
go run ./cmd/api
```

### Mobile
```bash
cd mobile
npx expo start -c
```
