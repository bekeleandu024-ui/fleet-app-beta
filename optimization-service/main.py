import os
import logging
import math
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import googlemaps
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Fleet Route Optimization Service")

# Initialize Google Maps Client
API_KEY = os.getenv("Maps_API_KEY")
if not API_KEY:
    logger.warning("Maps_API_KEY not found in environment variables. Distance matrix calls will fail.")
    gmaps = None
else:
    gmaps = googlemaps.Client(key=API_KEY)

# --- Pydantic Models ---

class Vehicle(BaseModel):
    id: str
    capacity_limit: int

class Stop(BaseModel):
    id: str
    latitude: float
    longitude: float
    demand: int  # e.g., weight or number of packages

class Depot(BaseModel):
    latitude: float
    longitude: float

class OptimizationRequest(BaseModel):
    vehicles: List[Vehicle]
    stops: List[Stop]
    depot: Depot

class RouteStep(BaseModel):
    stop_id: str
    distance_from_prev_meters: int
    cumulative_distance_meters: int

class VehicleRoute(BaseModel):
    vehicle_id: str
    steps: List[RouteStep]
    total_distance_meters: int
    total_load: int

class OptimizationResponse(BaseModel):
    routes: List[VehicleRoute]
    total_distance_meters: int
    total_distance_km: float
    status: str

# --- Helper Functions ---

def get_distance_matrix(locations: List[tuple]) -> List[List[int]]:
    """
    Fetches the distance matrix from Google Maps API.
    Returns a 2D list of distances in meters.
    """
    if not gmaps:
        logger.warning("Google Maps API key not configured. Using Haversine distance fallback.")
        matrix = []
        for i in range(len(locations)):
            row = []
            for j in range(len(locations)):
                if i == j:
                    row.append(0)
                else:
                    lat1, lon1 = locations[i]
                    lat2, lon2 = locations[j]
                    # Haversine formula
                    R = 6371000  # Radius of Earth in meters
                    phi1, phi2 = math.radians(lat1), math.radians(lat2)
                    dphi = math.radians(lat2 - lat1)
                    dlambda = math.radians(lon2 - lon1)
                    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                    row.append(int(R * c))
            matrix.append(row)
        return matrix

    # Google Maps Distance Matrix API has a limit of 100 elements per request (origins * destinations).
    # For a standard plan, it's 25 origins and 25 destinations max per request.
    # If len(locations) * len(locations) > 100, we need to chunk the requests.
    
    num_locations = len(locations)
    if num_locations * num_locations > 100:
        # TODO: Chunking is required for larger fleets.
        # Implement logic to break down the matrix request into smaller sub-matrices 
        # and reconstruct the full matrix.
        logger.warning(f"Requesting matrix for {num_locations} locations ({num_locations**2} elements). This might exceed API limits if not chunked.")
    
    # Format locations for the API: "lat,lng"
    formatted_locations = [f"{lat},{lng}" for lat, lng in locations]

    try:
        # Request distance matrix
        # mode='driving' is standard for fleet management
        response = gmaps.distance_matrix(
            origins=formatted_locations,
            destinations=formatted_locations,
            mode='driving'
        )
    except Exception as e:
        logger.error(f"Google Maps API error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch distance matrix: {str(e)}")

    if response['status'] != 'OK':
        raise HTTPException(status_code=500, detail=f"Distance Matrix API returned status: {response['status']}")

    matrix = []
    rows = response['rows']
    
    for i, row in enumerate(rows):
        matrix_row = []
        elements = row['elements']
        for j, element in enumerate(elements):
            if element['status'] == 'OK':
                # Value is in meters
                matrix_row.append(element['distance']['value'])
            else:
                # If route is impossible, assign a very high cost
                logger.warning(f"Route not found between {i} and {j}")
                matrix_row.append(1000000000) 
        matrix.append(matrix_row)

    return matrix

# --- Main Endpoint ---

@app.post("/api/optimize", response_model=OptimizationResponse)
def optimize_routes(request: OptimizationRequest):
    if not request.vehicles or not request.stops:
        raise HTTPException(status_code=400, detail="Vehicles and stops are required.")

    # 1. Prepare Data for OR-Tools
    # Node 0 is the Depot. Nodes 1..N are the stops.
    
    # Combine depot and stops into a single list of coordinates
    # Index 0: Depot
    # Index 1..N: Stops
    all_locations = [(request.depot.latitude, request.depot.longitude)]
    
    # Map internal node index to Stop object for easy retrieval later
    # node_index -> Stop
    node_map = {} 
    
    # Demands array. Depot has 0 demand.
    demands = [0] 
    
    for i, stop in enumerate(request.stops):
        all_locations.append((stop.latitude, stop.longitude))
        demands.append(stop.demand)
        node_map[i + 1] = stop # +1 because 0 is depot

    # Vehicle capacities
    vehicle_capacities = [v.capacity_limit for v in request.vehicles]
    num_vehicles = len(request.vehicles)
    depot_index = 0

    # 2. Get Distance Matrix (Real World Data)
    try:
        distance_matrix = get_distance_matrix(all_locations)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error getting matrix: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during distance calculation")

    # 3. Create Routing Model
    manager = pywrapcp.RoutingIndexManager(
        len(distance_matrix), num_vehicles, depot_index
    )
    routing = pywrapcp.RoutingModel(manager)

    # 4. Define Distance Callback
    def distance_callback(from_index, to_index):
        # Returns the distance between the two nodes.
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)

    # Define cost of each arc (distance)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 5. Add Capacity Constraints
    def demand_callback(from_index):
        # Returns the demand of the node.
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        vehicle_capacities,  # vehicle maximum capacities
        True,  # start cumul to zero
        "Capacity"
    )

    # 6. Set Search Parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    # PATH_CHEAPEST_ARC is a good first solution strategy for CVRP
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    # Optional: Use Guided Local Search for better results if time permits
    # search_parameters.local_search_metaheuristic = (
    #    routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    # )
    # search_parameters.time_limit.seconds = 5

    # 7. Solve
    solution = routing.SolveWithParameters(search_parameters)

    # 8. Construct Response
    if solution:
        routes_response = []
        total_distance_all_routes = 0

        for vehicle_id in range(num_vehicles):
            index = routing.Start(vehicle_id)
            route_steps = []
            route_distance = 0
            route_load = 0
            
            # The vehicle object from request
            vehicle_obj = request.vehicles[vehicle_id]

            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                
                # If it's not the depot (0), add it to the steps
                if node_index != 0:
                    stop_obj = node_map[node_index]
                    route_load += demands[node_index]
                    
                    # Calculate distance from previous node
                    # We need the previous index to calculate the leg distance
                    # But for the first node, previous is start (depot)
                    # This logic is slightly simplified; usually we track prev_index
                    pass

                previous_index = index
                index = solution.Value(routing.NextVar(index))
                
                # Calculate distance for this leg
                leg_distance = routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
                route_distance += leg_distance
                
                # Add step info (for the node we just arrived at, which is 'index')
                current_node = manager.IndexToNode(index)
                if current_node != 0: # If we arrived at a stop
                    stop_obj = node_map[current_node]
                    route_steps.append(RouteStep(
                        stop_id=stop_obj.id,
                        distance_from_prev_meters=leg_distance,
                        cumulative_distance_meters=route_distance
                    ))

            total_distance_all_routes += route_distance
            
            routes_response.append(VehicleRoute(
                vehicle_id=vehicle_obj.id,
                steps=route_steps,
                total_distance_meters=route_distance,
                total_load=route_load
            ))

        return OptimizationResponse(
            routes=routes_response,
            total_distance_meters=total_distance_all_routes,
            total_distance_km=total_distance_all_routes / 1000.0,
            status="OPTIMAL"
        )
    else:
        # No solution found
        return OptimizationResponse(
            routes=[],
            total_distance_meters=0,
            total_distance_km=0,
            status="NO_SOLUTION_FOUND"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
