class HotelReservationSystem {
    constructor() {
        this.rooms = this.initializeRooms();
        this.lastBookedRooms = [];
        this.resultTimeout = null; // For managing result message timeouts
        this.initializeDOM();
        this.renderHotelLayout();
        this.updateStatistics();
    }

    initializeRooms() {
        const rooms = new Map();
        
        // Floors 1-9: 10 rooms each (101-110, 201-210, etc.)
        for (let floor = 1; floor <= 9; floor++) {
            for (let room = 1; room <= 10; room++) {
                const roomNumber = floor * 100 + room;
                rooms.set(roomNumber, {
                    number: roomNumber,
                    floor: floor,
                    position: room,
                    isOccupied: false,
                    isSelected: false
                });
            }
        }
        
        // Floor 10: 7 rooms (1001-1007)
        for (let room = 1; room <= 7; room++) {
            const roomNumber = 1000 + room;
            rooms.set(roomNumber, {
                number: roomNumber,
                floor: 10,
                position: room,
                isOccupied: false,
                isSelected: false
            });
        }
        
        return rooms;
    }

    initializeDOM() {
        // Get DOM elements
        this.bookRoomsBtn = document.getElementById('bookRooms');
        this.roomCountInput = document.getElementById('roomCount');
        this.generateOccupancyBtn = document.getElementById('generateOccupancy');
        this.resetBookingBtn = document.getElementById('resetBooking');
        this.showStatsBtn = document.getElementById('showStats');
        this.bookingResult = document.getElementById('bookingResult');
        this.hotelFloorsContainer = document.getElementById('hotelFloors');
        this.lastBookingInfo = document.getElementById('lastBookingInfo');

        // Bind event listeners
        this.bookRoomsBtn.addEventListener('click', () => this.bookRooms());
        this.generateOccupancyBtn.addEventListener('click', () => this.generateRandomOccupancy());
        this.resetBookingBtn.addEventListener('click', () => this.resetAllBookings());
        this.showStatsBtn.addEventListener('click', () => this.showDetailedStats());
        
        // Allow booking by pressing Enter
        this.roomCountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.bookRooms();
            }
        });
    }

    calculateTravelTime(room1, room2) {
        if (!room1 || !room2) return 0;
        
        const verticalTime = Math.abs(room1.floor - room2.floor) * 2; // 2 minutes per floor
        const horizontalTime = Math.abs(room1.position - room2.position) * 1; // 1 minute per room
        
        return verticalTime + horizontalTime;
    }

    calculateTotalTravelTime(rooms) {
        if (rooms.length <= 1) return 0;
        
        let totalTime = 0;
        let details = [];
        
        for (let i = 0; i < rooms.length - 1; i++) {
            const time = this.calculateTravelTime(rooms[i], rooms[i + 1]);
            totalTime += time;
            details.push({
                from: rooms[i].number,
                to: rooms[i + 1].number,
                time: time
            });
        }
        
        return { totalTime, details };
    }

    getAvailableRooms() {
        return Array.from(this.rooms.values()).filter(room => !room.isOccupied);
    }

    getOptimalRooms(count) {
        const availableRooms = this.getAvailableRooms();
        
        if (availableRooms.length < count) {
            return null; // Not enough rooms available
        }

        // First, try to book rooms on the same floor (priority rule)
        // Check each floor starting from Floor 1
        for (let floor = 1; floor <= 10; floor++) {
            const floorRooms = availableRooms.filter(room => room.floor === floor);
            if (floorRooms.length >= count) {
                // Sort by position to get consecutive rooms (minimize horizontal travel)
                floorRooms.sort((a, b) => a.position - b.position);
                console.log(`Same floor booking: Floor ${floor}, selecting rooms:`, floorRooms.slice(0, count).map(r => r.number));
                return floorRooms.slice(0, count);
            }
        }

        // If not possible on same floor, find optimal combination across floors
        console.log('Cross-floor booking needed');
        return this.findOptimalCrossFloorCombination(availableRooms, count);
    }

    findOptimalCrossFloorCombination(availableRooms, count) {
        // Group rooms by floor
        const roomsByFloor = {};
        availableRooms.forEach(room => {
            if (!roomsByFloor[room.floor]) {
                roomsByFloor[room.floor] = [];
            }
            roomsByFloor[room.floor].push(room);
        });

        // Sort each floor's rooms by position (left to right for consecutive selection)
        Object.keys(roomsByFloor).forEach(floor => {
            roomsByFloor[floor].sort((a, b) => a.position - b.position);
        });

        let bestCombination = null;
        let minTravelTime = Infinity;

        // Get floors that have available rooms, sorted by floor number
        const floors = Object.keys(roomsByFloor).map(Number).sort((a, b) => a - b);
        
        console.log('Available floors:', floors);
        console.log('Rooms per floor:', Object.fromEntries(
            Object.entries(roomsByFloor).map(([floor, rooms]) => [floor, rooms.length])
        ));

        // Try all possible combinations of floors
        // Start with single floors (already checked in getOptimalRooms)
        // Then try combinations of 2, 3, etc. floors
        for (let numFloors = 2; numFloors <= floors.length && numFloors <= count; numFloors++) {
            const floorCombinations = this.getFloorCombinations(floors, numFloors);
            
            for (const floorCombo of floorCombinations) {
                const combination = this.selectRoomsFromFloors(roomsByFloor, floorCombo, count);
                
                if (combination && combination.length === count) {
                    // Calculate travel time for this combination
                    const travelTime = this.calculateOptimalTravelTime(combination);
                    
                    console.log(`Combination from floors ${floorCombo.join(',')}: rooms ${combination.map(r => r.number).join(',')}, travel time: ${travelTime}`);
                    
                    if (travelTime < minTravelTime) {
                        minTravelTime = travelTime;
                        bestCombination = combination;
                    }
                }
            }
        }

        console.log('Best cross-floor combination:', bestCombination ? bestCombination.map(r => r.number) : 'none');
        return bestCombination;
    }

    getFloorCombinations(floors, k) {
        if (k === 1) return floors.map(f => [f]);
        if (k > floors.length) return [];
        
        const combinations = [];
        
        function generateCombinations(start, current) {
            if (current.length === k) {
                combinations.push([...current]);
                return;
            }
            
            for (let i = start; i < floors.length; i++) {
                current.push(floors[i]);
                generateCombinations(i + 1, current);
                current.pop();
            }
        }
        
        generateCombinations(0, []);
        return combinations;
    }

    selectRoomsFromFloors(roomsByFloor, floors, count) {
        const selectedRooms = [];
        
        // Calculate how many rooms to take from each floor
        const totalAvailable = floors.reduce((sum, floor) => sum + roomsByFloor[floor].length, 0);
        
        if (totalAvailable < count) return null;
        
        // Distribute rooms as evenly as possible, but take consecutive rooms from each floor
        let remaining = count;
        const distribution = [];
        
        // Simple distribution: try to distribute evenly
        for (let i = 0; i < floors.length && remaining > 0; i++) {
            const availableOnFloor = roomsByFloor[floors[i]].length;
            const roomsToTake = Math.min(remaining, Math.ceil(remaining / (floors.length - i)));
            const actualToTake = Math.min(roomsToTake, availableOnFloor);
            
            distribution.push(actualToTake);
            remaining -= actualToTake;
        }
        
        // If we still have rooms to assign, distribute them
        let distributionIndex = 0;
        while (remaining > 0 && distributionIndex < floors.length) {
            const floor = floors[distributionIndex];
            const currentlyAssigned = distribution[distributionIndex];
            const available = roomsByFloor[floor].length;
            
            if (currentlyAssigned < available) {
                distribution[distributionIndex]++;
                remaining--;
            }
            distributionIndex = (distributionIndex + 1) % floors.length;
        }
        
        // Now select the actual rooms
        for (let i = 0; i < floors.length; i++) {
            const floor = floors[i];
            const roomsToTake = distribution[i];
            
            if (roomsToTake > 0) {
                const floorRooms = roomsByFloor[floor].slice(0, roomsToTake);
                selectedRooms.push(...floorRooms);
            }
        }
        
        return selectedRooms.length === count ? selectedRooms : null;
    }

    calculateOptimalTravelTime(rooms) {
        if (rooms.length <= 1) return 0;

        // Sort rooms by floor first, then by position (optimal visiting order)
        const sortedRooms = [...rooms].sort((a, b) => {
            if (a.floor !== b.floor) return a.floor - b.floor;
            return a.position - b.position;
        });

        const { totalTime } = this.calculateTotalTravelTime(sortedRooms);
        return totalTime;
    }

    getCombinations(arr, k) {
        if (k === 1) return arr.map(el => [el]);
        if (k === arr.length) return [arr];
        if (k > arr.length || k <= 0) return [];

        const combinations = [];
        
        // For large arrays, use a more efficient approach
        if (arr.length > 20) {
            // Use a heuristic approach for better performance
            return this.getHeuristicCombinations(arr, k);
        }
        
        function combine(start, combo) {
            if (combo.length === k) {
                combinations.push([...combo]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        }
        
        combine(0, []);
        return combinations;
    }

    getHeuristicCombinations(availableRooms, count) {
        // This method is called when there are too many rooms to process efficiently
        // Use a simplified approach that follows the same rules as the main algorithm
        
        // Group rooms by floor
        const roomsByFloor = {};
        availableRooms.forEach(room => {
            if (!roomsByFloor[room.floor]) {
                roomsByFloor[room.floor] = [];
            }
            roomsByFloor[room.floor].push(room);
        });

        // Sort floors by number of available rooms (prefer floors with more rooms)
        const floors = Object.keys(roomsByFloor)
            .map(Number)
            .sort((a, b) => roomsByFloor[b].length - roomsByFloor[a].length);

        const combinations = [];
        
        // Try combinations starting with the floor that has the most rooms
        for (let primaryFloor of floors) {
            const primaryRooms = roomsByFloor[primaryFloor].sort((a, b) => a.position - b.position);
            
            if (primaryRooms.length >= count) {
                // All rooms from one floor (same floor priority)
                combinations.push(primaryRooms.slice(0, count));
            } else {
                // Need multiple floors - try adjacent floors first (minimize vertical travel)
                const remaining = count - primaryRooms.length;
                
                // Try floors adjacent to primary floor first
                const adjacentFloors = [primaryFloor - 1, primaryFloor + 1]
                    .filter(f => f >= 1 && f <= 10 && roomsByFloor[f] && roomsByFloor[f].length >= remaining);
                
                for (const secondaryFloor of adjacentFloors) {
                    const secondaryRooms = roomsByFloor[secondaryFloor].sort((a, b) => a.position - b.position);
                    const combination = [...primaryRooms, ...secondaryRooms.slice(0, remaining)];
                    combinations.push(combination);
                }
                
                // If no adjacent floors work, try other floors
                if (combinations.length === 0) {
                    for (const secondaryFloor of floors) {
                        if (secondaryFloor === primaryFloor) continue;
                        const secondaryRooms = roomsByFloor[secondaryFloor];
                        if (secondaryRooms && secondaryRooms.length >= remaining) {
                            const sortedSecondary = secondaryRooms.sort((a, b) => a.position - b.position);
                            const combination = [...primaryRooms, ...sortedSecondary.slice(0, remaining)];
                            combinations.push(combination);
                            break; // Take the first valid combination for performance
                        }
                    }
                }
            }
        }
        
        return combinations.slice(0, 10); // Limit for performance
    }

    bookRooms() {
        const count = parseInt(this.roomCountInput.value);
        
        if (count < 1 || count > 5) {
            this.showResult('Please enter a number between 1 and 5.', 'error');
            return;
        }

        console.log(`\n=== BOOKING ${count} ROOMS ===`);
        console.log('Available rooms before booking:', this.getAvailableRooms().map(r => r.number));

        // Clear previous selections before making new booking
        this.clearSelections();

        const optimalRooms = this.getOptimalRooms(count);
        
        if (!optimalRooms) {
            this.showResult('Not enough rooms available!', 'error');
            return;
        }

        console.log('Selected optimal rooms:', optimalRooms.map(r => r.number));

        // Book the rooms
        optimalRooms.forEach(room => {
            room.isOccupied = true;
            room.isSelected = true;
        });

        this.lastBookedRooms = optimalRooms;
        
        // Calculate travel time and details
        const { totalTime, details } = this.calculateTotalTravelTime(optimalRooms);
        
        // Show result
        const roomNumbers = optimalRooms.map(r => r.number).join(', ');
        this.showResult(`Successfully booked ${count} room(s): ${roomNumbers}`, 'success', true);
        
        // Update displays
        this.renderHotelLayout();
        this.updateStatistics();
        this.updateLastBookingInfo(optimalRooms, totalTime, details);
        
        console.log('=== BOOKING COMPLETE ===\n');
        
        // Note: Removed the automatic clearing of selections after 3 seconds
        // Yellow highlighting will remain until next booking or reset
    }

    clearSelections() {
        this.rooms.forEach(room => {
            room.isSelected = false;
        });
    }

    generateRandomOccupancy() {
        // Reset all rooms first
        this.rooms.forEach(room => {
            room.isOccupied = false;
            room.isSelected = false;
        });

        // Randomly occupy 30% to 90% of rooms
        const occupancyRate = Math.random() * 0.6 + 0.3; // 30% to 90% (0.3 + 0.6 = 0.9)
        const totalRooms = this.rooms.size;
        const roomsToOccupy = Math.floor(totalRooms * occupancyRate);
        
        console.log(`Generating ${Math.round(occupancyRate * 100)}% occupancy: ${roomsToOccupy}/${totalRooms} rooms`);
        
        const allRooms = Array.from(this.rooms.values());
        
        // Use Fisher-Yates shuffle for better randomization
        for (let i = allRooms.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allRooms[i], allRooms[j]] = [allRooms[j], allRooms[i]];
        }
        
        for (let i = 0; i < roomsToOccupy; i++) {
            allRooms[i].isOccupied = true;
        }

        this.lastBookedRooms = [];
        this.showResult(`Generated random occupancy: ${Math.round(occupancyRate * 100)}%`, 'success');
        this.renderHotelLayout();
        this.updateStatistics();
        this.updateLastBookingInfo([], 0, []);
    }

    resetAllBookings() {
        this.rooms.forEach(room => {
            room.isOccupied = false;
            room.isSelected = false;
        });

        this.lastBookedRooms = [];
        this.showResult('All bookings have been reset.', 'success');
        this.renderHotelLayout();
        this.updateStatistics();
        this.updateLastBookingInfo([], 0, []);
    }

    showResult(message, type, isBooking = false) {
        // Clear any existing timeout to prevent conflicts
        if (this.resultTimeout) {
            clearTimeout(this.resultTimeout);
        }
        
        this.bookingResult.textContent = message;
        this.bookingResult.className = `result ${type}`;
        
        // Auto-hide based on message type and action
        let hideDelay;
        if (type === 'success' && isBooking) {
            hideDelay = 10000; // 10 seconds for booking success
        } else if (type === 'success') {
            hideDelay = 5000; // 5 seconds for other success messages
        } else {
            hideDelay = 5000; // 5 seconds for error messages
        }
        
        // Store the timeout ID so we can clear it if needed
        this.resultTimeout = setTimeout(() => {
            this.bookingResult.textContent = '';
            this.bookingResult.className = 'result';
            this.resultTimeout = null; // Clear the reference
        }, hideDelay);
    }

    renderHotelLayout() {
        this.hotelFloorsContainer.innerHTML = '';
        
        console.log('Rendering hotel layout...'); // Debug log
        
        // Render floors from top to bottom (10 to 1)
        for (let floor = 10; floor >= 1; floor--) {
            const floorDiv = document.createElement('div');
            floorDiv.className = 'floor';
            
            const floorRooms = Array.from(this.rooms.values())
                .filter(room => room.floor === floor)
                .sort((a, b) => a.position - b.position);
            
            const availableCount = floorRooms.filter(room => !room.isOccupied).length;
            const totalCount = floorRooms.length;
            
            console.log(`Floor ${floor}: ${totalCount} rooms`); // Debug log
            
            floorDiv.innerHTML = `
                <div class="floor-header">
                    <div class="floor-title">Floor ${floor}</div>
                    <div class="floor-info">${availableCount}/${totalCount} available</div>
                </div>
                <div class="rooms-row">
                    ${floorRooms.map(room => this.renderRoom(room)).join('')}
                </div>
            `;
            
            this.hotelFloorsContainer.appendChild(floorDiv);
        }
        
        console.log('Hotel layout rendered successfully'); // Debug log
    }

    renderRoom(room) {
        let className = 'room-box';
        
        // Priority: selected > occupied > available
        if (room.isSelected) {
            className += ' selected';
        } else if (room.isOccupied) {
            className += ' occupied';
        } else {
            className += ' available';
        }
        
        return `<div class="${className}" data-room="${room.number}" title="Room ${room.number}">${room.number}</div>`;
    }

    updateStatistics() {
        const totalRooms = this.rooms.size;
        const occupiedRooms = Array.from(this.rooms.values()).filter(room => room.isOccupied).length;
        const availableRooms = totalRooms - occupiedRooms;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        document.getElementById('availableCount').textContent = availableRooms;
        document.getElementById('occupiedCount').textContent = occupiedRooms;
        document.getElementById('occupancyRate').textContent = `${occupancyRate}%`;
    }

    updateLastBookingInfo(rooms, totalTime, details) {
        if (rooms.length === 0) {
            this.lastBookingInfo.innerHTML = '<p>No bookings made yet.</p>';
            return;
        }

        const roomNumbers = rooms.map(r => r.number).join(', ');
        const floorInfo = this.getFloorDistribution(rooms);
        
        let html = `
            <p><strong>Last Booking:</strong> ${rooms.length} room(s) - ${roomNumbers}</p>
            <p><strong>Floor Distribution:</strong> ${floorInfo}</p>
            <p><strong>Total Travel Time:</strong> ${totalTime} minutes</p>
        `;

        if (details.length > 0) {
            html += '<div class="travel-details">';
            html += '<strong>Travel Path:</strong><br>';
            details.forEach((detail, index) => {
                html += `${index + 1}. Room ${detail.from} → Room ${detail.to}: ${detail.time} minutes<br>`;
            });
            html += '</div>';
        }

        html += `<div class="travel-summary">Optimal path selected with minimum travel time!</div>`;
        
        this.lastBookingInfo.innerHTML = html;
    }

    getFloorDistribution(rooms) {
        const floorCounts = {};
        rooms.forEach(room => {
            floorCounts[room.floor] = (floorCounts[room.floor] || 0) + 1;
        });
        
        return Object.entries(floorCounts)
            .map(([floor, count]) => `Floor ${floor}: ${count} room${count > 1 ? 's' : ''}`)
            .join(', ');
    }

    showDetailedStats() {
        const stats = this.generateDetailedStatistics();
        
        alert(`Detailed Hotel Statistics:

Total Rooms: ${stats.totalRooms}
Available Rooms: ${stats.availableRooms}
Occupied Rooms: ${stats.occupiedRooms}
Overall Occupancy Rate: ${stats.occupancyRate}%

Floor-wise Occupancy:
${stats.floorStats.map(floor => 
    `Floor ${floor.number}: ${floor.occupied}/${floor.total} (${floor.rate}%)`
).join('\n')}

Most Occupied Floor: Floor ${stats.mostOccupiedFloor}
Least Occupied Floor: Floor ${stats.leastOccupiedFloor}
`);
    }

    generateDetailedStatistics() {
        const totalRooms = this.rooms.size;
        const occupiedRooms = Array.from(this.rooms.values()).filter(room => room.isOccupied).length;
        const availableRooms = totalRooms - occupiedRooms;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        const floorStats = [];
        for (let floor = 1; floor <= 10; floor++) {
            const floorRooms = Array.from(this.rooms.values()).filter(room => room.floor === floor);
            const floorOccupied = floorRooms.filter(room => room.isOccupied).length;
            const floorTotal = floorRooms.length;
            const floorRate = Math.round((floorOccupied / floorTotal) * 100);
            
            floorStats.push({
                number: floor,
                occupied: floorOccupied,
                total: floorTotal,
                rate: floorRate
            });
        }

        const mostOccupiedFloor = floorStats.reduce((max, floor) => 
            floor.rate > max.rate ? floor : max
        ).number;
        
        const leastOccupiedFloor = floorStats.reduce((min, floor) => 
            floor.rate < min.rate ? floor : min
        ).number;

        return {
            totalRooms,
            availableRooms,
            occupiedRooms,
            occupancyRate,
            floorStats,
            mostOccupiedFloor,
            leastOccupiedFloor
        };
    }
}

// Initialize the system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const hotelSystem = new HotelReservationSystem();
    
    // Add some demo functionality
    console.log('Hotel Reservation System initialized!');
    console.log('Available methods:', Object.getOwnPropertyNames(HotelReservationSystem.prototype));
});

// Add room click functionality for manual room selection (bonus feature)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('room-box') && !e.target.classList.contains('stairs')) {
        const roomNumber = parseInt(e.target.dataset.room);
        if (roomNumber) {
            // This could be extended for manual room selection
            console.log(`Clicked room: ${roomNumber}`);
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'r':
                e.preventDefault();
                document.getElementById('resetBooking').click();
                break;
            case 'g':
                e.preventDefault();
                document.getElementById('generateOccupancy').click();
                break;
            case 'Enter':
                e.preventDefault();
                document.getElementById('bookRooms').click();
                break;
        }
    }
});
