# Hotel Room Reservation System

A sophisticated web-based hotel reservation system that optimally assigns rooms based on travel time minimization algorithms.

## 🚀 Live Demo

**Live URL**: [Your deployment URL will go here]

## 🏨 Features

### Core Functionality
- **Smart Room Booking**: Book 1-5 rooms with optimal placement algorithm
- **Travel Time Optimization**: Minimizes walking time between booked rooms
- **Visual Hotel Layout**: Interactive floor-by-floor room visualization
- **Real-time Statistics**: Live occupancy rates and room availability
- **Random Occupancy Generator**: For testing and demonstration
- **Complete Reset**: Clear all bookings with one click

### Hotel Specifications
- **97 Total Rooms** across 10 floors
- **Floors 1-9**: 10 rooms each (101-110, 201-210, etc.)
- **Floor 10**: 7 rooms (1001-1007)
- **Travel Time Calculation**:
  - Horizontal: 1 minute per room
  - Vertical: 2 minutes per floor

### Booking Algorithm
1. **Same Floor Priority**: Attempts to book all rooms on the same floor first
2. **Optimal Cross-Floor**: If same floor unavailable, calculates minimum travel time across floors
3. **Sequential Preference**: Prefers consecutive room numbers when possible
4. **Smart Path Planning**: Optimizes the walking route between all booked rooms



### Performance Optimizations
- **Heuristic Combinations**: For large room counts, uses smart floor grouping
- **Efficient Rendering**: Virtual DOM updates only changed elements
- **Memory Management**: Optimized data structures for 97-room capacity

## 🏗️ Project Structure

```
hotel-reservation-system/
├── index.html          # Main HTML structure
├── styles.css          # Responsive CSS styling
├── script.js           # Core JavaScript logic
├── README.md           # Documentation
└── package.json        # Dependencies (if needed)
```


## Future Enhancements

While the current version is fully functional, I have several ideas for how I could extend the project in the future:

- **Manual Room Selection:** I plan to add a feature that would allow users to click on specific available rooms on the floor plan to create a custom booking, bypassing the algorithm.
- **Date-Based Bookings:** To make the system more realistic, I want to implement a date picker. This would allow users to check availability and make reservations for future dates, not just for the current moment.
- **Persistent Data:** To save the hotel's state between sessions, I'd like to integrate a backend service (like Node.js/Express) and a database (like MongoDB or PostgreSQL).
- **Different Room Types:** I could also introduce different categories of rooms (e.g., Standard, Deluxe, Suite) with varying booking rules or costs to add another layer of complexity.
- **Booking History:** Adding a feature to view a log of all past bookings made during a session is another goal.
- **User Authentication:** Finally, I plan to create a simple login system to differentiate between guests and hotel staff, who might have different permissions or views.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.