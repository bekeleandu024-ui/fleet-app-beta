# Optimization Service Guide

This service uses Python and Google OR-Tools to solve Vehicle Routing Problems (VRP).

## Prerequisites
- Python 3.11+
- Google Maps API Key (Optional, but recommended for real distances)

## Setup & Run
The service is located in `optimization-service/`.

### 1. Install Dependencies
```powershell
cd optimization-service
pip install -r requirements.txt
```

### 2. Start the Service
```powershell
python main.py
```
The service will start on `http://localhost:8000`.

## Configuration
Create a `.env` file in `optimization-service/` with:
```
Maps_API_KEY=your_google_maps_api_key
```
If no API key is provided, the service falls back to Haversine (straight-line) distance calculation.

## API Endpoint
**POST** `/api/optimize`
Accepts JSON with `vehicles`, `stops`, and `depot`.
Returns optimized routes and sequence.
