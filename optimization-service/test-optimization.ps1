$body = @{
    vehicles = @(
        @{ id = "v1"; capacity_limit = 10 }
    )
    stops = @(
        @{ id = "s1"; latitude = 40.7128; longitude = -74.0060; demand = 1 }
        @{ id = "s2"; latitude = 40.7306; longitude = -73.9352; demand = 1 }
    )
    depot = @{ latitude = 40.7580; longitude = -73.9855 }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:8000/api/optimize" -Method Post -Body $body -ContentType "application/json"