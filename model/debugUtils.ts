/// <reference path="./../openrct2.d.ts" />

/**
 * Debug utilities for identifying entities in the game
 */

/**
 * Finds and logs all entertainers in the park with their details
 */
export function logAllEntertainers(): void {
    console.log('=== ENTERTAINERS IN PARK ===');
    const staff = map.getAllEntities("staff");
    let entertainerCount = 0;
    
    staff.forEach((member) => {
        if (member.staffType === "entertainer") {
            entertainerCount++;
            const tile = { x: Math.floor(member.x / 32), y: Math.floor(member.y / 32) };
            console.log(`[${entertainerCount}] ${member.name}`);
            console.log(`  - ID: ${member.id}`);
            console.log(`  - Tile: (${tile.x}, ${tile.y})`);
            console.log(`  - Position: (${member.x}, ${member.y}, ${member.z})`);
            console.log(`  - Costume: ${member.costume}`);
            console.log(`  - Animation: ${member.animation}`);
            console.log(`  - Animation Offset: ${member.animationOffset}`);
            console.log(`  - Animation Length: ${member.animationLength}`);
            console.log('');
        }
    });
    
    console.log(`Total entertainers found: ${entertainerCount}`);
}

/**
 * Finds entertainers by name (partial match, case insensitive)
 */
export function findEntertainersByName(searchName: string): void {
    console.log(`=== SEARCHING FOR ENTERTAINERS: "${searchName}" ===`);
    const staff = map.getAllEntities("staff");
    let foundCount = 0;
    
    staff.forEach((member) => {
        if (member.staffType === "entertainer" && 
            member.name.toLowerCase().includes(searchName.toLowerCase())) {
            foundCount++;
            const tile = { x: Math.floor(member.x / 32), y: Math.floor(member.y / 32) };
            console.log(`[MATCH] ${member.name}`);
            console.log(`  - ID: ${member.id}`);
            console.log(`  - Tile: (${tile.x}, ${tile.y})`);
            console.log(`  - Costume: ${member.costume}`);
            console.log(`  - Animation: ${member.animation}`);
            console.log('');
        }
    });
    
    console.log(`Found ${foundCount} matching entertainer(s)`);
}

/**
 * Finds entertainers near a specific tile
 */
export function findEntertainersNearTile(tileX: number, tileY: number, radius: number = 5): void {
    console.log(`=== ENTERTAINERS NEAR TILE (${tileX}, ${tileY}) - Radius: ${radius} ===`);
    const staff = map.getAllEntities("staff");
    let foundCount = 0;
    
    staff.forEach((member) => {
        if (member.staffType === "entertainer") {
            const tile = { x: Math.floor(member.x / 32), y: Math.floor(member.y / 32) };
            const distance = Math.sqrt(
                Math.pow(tile.x - tileX, 2) + Math.pow(tile.y - tileY, 2)
            );
            
            if (distance <= radius) {
                foundCount++;
                console.log(`[${distance.toFixed(1)} tiles away] ${member.name}`);
                console.log(`  - ID: ${member.id}`);
                console.log(`  - Tile: (${tile.x}, ${tile.y})`);
                console.log(`  - Costume: ${member.costume}`);
                console.log(`  - Animation: ${member.animation}`);
                console.log('');
            }
        }
    });
    
    console.log(`Found ${foundCount} entertainer(s) within radius`);
}

/**
 * Logs detailed info about a specific staff member by ID
 */
export function logStaffById(id: number): void {
    const entity = map.getEntity(id);
    if (!entity) {
        console.log(`No entity found with ID: ${id}`);
        return;
    }
    
    if (entity.type !== "staff") {
        console.log(`Entity ${id} is not a staff member (type: ${entity.type})`);
        return;
    }
    
    const staff = entity as Staff;
    const tile = { x: Math.floor(staff.x / 32), y: Math.floor(staff.y / 32) };
    
    console.log('=== STAFF MEMBER DETAILS ===');
    console.log(`Name: ${staff.name}`);
    console.log(`ID: ${staff.id}`);
    console.log(`Type: ${staff.staffType}`);
    console.log(`Tile: (${tile.x}, ${tile.y})`);
    console.log(`Position: (${staff.x}, ${staff.y}, ${staff.z})`);
    console.log(`Direction: ${staff.direction}`);
    console.log(`Energy: ${staff.energy}`);
    
    if (staff.staffType === "entertainer") {
        console.log(`Costume: ${staff.costume}`);
        console.log(`Available Costumes: ${staff.availableCostumes.join(', ')}`);
    }
    
    console.log(`Animation: ${staff.animation}`);
    console.log(`Animation Offset: ${staff.animationOffset}`);
    console.log(`Animation Length: ${staff.animationLength}`);
    console.log(`Available Animations: ${staff.availableAnimations.join(', ')}`);
}

/**
 * Lists all rides in the park with their details
 */
export function logAllRides(): void {
    console.log('=== ALL RIDES IN PARK ===');
    const rides = map.rides;
    
    rides.forEach((ride, index) => {
        console.log(`[${index + 1}/${rides.length}] ${ride.name}`);
        console.log(`  - ID: ${ride.id}`);
        console.log(`  - Type: ${ride.type}`);
        console.log(`  - Classification: ${ride.classification}`);
        console.log(`  - Status: ${ride.status}`);
        console.log(`  - Excitement: ${(ride.excitement / 100).toFixed(2)}`);
        console.log(`  - Intensity: ${(ride.intensity / 100).toFixed(2)}`);
        console.log(`  - Nausea: ${(ride.nausea / 100).toFixed(2)}`);
        console.log(`  - Stations: ${ride.stations.length}`);
        console.log('');
    });
    
    console.log(`Total rides: ${rides.length}`);
}

/**
 * Finds rides by name (partial match, case insensitive)
 */
export function findRidesByName(searchName: string): void {
    console.log(`=== SEARCHING FOR RIDES: "${searchName}" ===`);
    const rides = map.rides;
    let foundCount = 0;
    
    rides.forEach((ride) => {
        if (ride.name.toLowerCase().includes(searchName.toLowerCase())) {
            foundCount++;
            console.log(`[MATCH] ${ride.name}`);
            console.log(`  - ID: ${ride.id}`);
            console.log(`  - Type: ${ride.type}`);
            console.log(`  - Classification: ${ride.classification}`);
            console.log(`  - Status: ${ride.status}`);
            console.log('');
        }
    });
    
    console.log(`Found ${foundCount} matching ride(s)`);
}

/**
 * Lists rides of a specific classification (ride, stall, facility)
 */
export function findRidesByClassification(classification: string): void {
    console.log(`=== RIDES WITH CLASSIFICATION: "${classification}" ===`);
    const rides = map.rides;
    let foundCount = 0;
    
    rides.forEach((ride) => {
        if (ride.classification === classification) {
            foundCount++;
            console.log(`[${foundCount}] ${ride.name}`);
            console.log(`  - ID: ${ride.id}`);
            console.log(`  - Type: ${ride.type}`);
            console.log(`  - Status: ${ride.status}`);
            console.log('');
        }
    });
    
    console.log(`Found ${foundCount} ${classification}(s)`);
}

/**
 * Logs detailed info about a specific ride by ID
 */
export function logRideById(id: number): void {
    const ride = map.getRide(id);
    
    if (!ride) {
        console.log(`No ride found with ID: ${id}`);
        return;
    }
    
    console.log('=== RIDE DETAILS ===');
    console.log(`Name: ${ride.name}`);
    console.log(`ID: ${ride.id}`);
    console.log(`Type: ${ride.type}`);
    console.log(`Classification: ${ride.classification}`);
    console.log(`Status: ${ride.status}`);
    console.log(`Object: ${ride.object.name}`);
    console.log('');
    
    console.log('--- Ratings ---');
    console.log(`Excitement: ${(ride.excitement / 100).toFixed(2)}`);
    console.log(`Intensity: ${(ride.intensity / 100).toFixed(2)}`);
    console.log(`Nausea: ${(ride.nausea / 100).toFixed(2)}`);
    console.log('');
    
    console.log('--- Stats ---');
    console.log(`Age: ${ride.age} months`);
    console.log(`Total Customers: ${ride.totalCustomers}`);
    console.log(`Total Profit: $${ride.totalProfit.toFixed(2)}`);
    console.log(`Value: $${ride.value.toFixed(2)}`);
    console.log('');
    
    console.log('--- Vehicles ---');
    console.log(`Number of Vehicles: ${ride.vehicles.length}`);
    ride.vehicles.forEach((vehicleId, index) => {
        console.log(`  Vehicle ${index + 1}: Entity ID ${vehicleId}`);
    });
    console.log('');
    
    console.log('--- Stations ---');
    ride.stations.forEach((station, index) => {
        console.log(`  Station ${index + 1}:`);
        console.log(`    Start: (${station.start.x}, ${station.start.y}, ${station.start.z})`);
        console.log(`    Length: ${station.length}`);
        if (station.entrance) {
            console.log(`    Entrance: (${station.entrance.x}, ${station.entrance.y}, ${station.entrance.z})`);
        }
        if (station.exit) {
            console.log(`    Exit: (${station.exit.x}, ${station.exit.y}, ${station.exit.z})`);
        }
    });
}

/**
 * Track a specific train's position in real-time
 * @param rideId The ride ID
 * @param trainIndex The train index (0 for first train, 1 for second, etc.)
 * @param durationTicks How many ticks to track for (default: 200)
 */
export function trackTrain(rideId: number, trainIndex: number, durationTicks: number = 200): void {
    console.log(`=== TRACKING TRAIN ${trainIndex} ON RIDE ${rideId} FOR ${durationTicks} TICKS ===`);
    
    const ride = map.getRide(rideId);
    if (!ride) {
        console.log(`Ride ${rideId} not found`);
        return;
    }
    
    if (trainIndex >= ride.vehicles.length) {
        console.log(`Train ${trainIndex} not found (ride has ${ride.vehicles.length} trains)`);
        return;
    }
    
    const carId = ride.vehicles[trainIndex];
    let ticksRemaining = durationTicks;
    let lastTileX = -1;
    let lastTileY = -1;
    
    const trackingSubscription = context.subscribe('interval.tick', () => {
        const entity = map.getEntity(carId);
        if (!entity || entity.type !== 'car') {
            console.log(`[TrackTrain] Car ${carId} not found or not a car`);
            trackingSubscription.dispose();
            return;
        }
        
        const car = entity as Car;
        const loc = car.trackLocation;
        const tileX = Math.floor(loc.x / 32);
        const tileY = Math.floor(loc.y / 32);
        
        // Only log when the train changes tiles
        if (tileX !== lastTileX || tileY !== lastTileY) {
            console.log(`[TrackTrain] Tick ${durationTicks - ticksRemaining}: Train ${trainIndex} (car ${carId}) at tile (${tileX}, ${tileY}) - exact: (${loc.x}, ${loc.y}, ${loc.z})`);
            lastTileX = tileX;
            lastTileY = tileY;
        }
        
        ticksRemaining--;
        if (ticksRemaining <= 0) {
            console.log(`[TrackTrain] Tracking complete`);
            trackingSubscription.dispose();
        }
    });
}

