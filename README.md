# Kapu Rocks - Community Platform

A modern, responsive website for the Kapu/Balija community to showcase businesses, schedule meetings, and celebrate achievements.

## Features

### 🏢 Business Directory
- List and display community businesses
- Filter by category (Retail, Services, Technology, Food & Beverage, Healthcare, Education, Other)
- Search functionality to find businesses quickly
- Add your own business with contact information

### 📅 Community Meetings
- Schedule weekly and monthly meetings
- View upcoming, weekly, monthly, and past meetings
- Display meeting details including date, time, and location
- Easy meeting management

### 🏆 Achievements & Appreciations
- Share and celebrate community achievements
- Categorize achievements (Academic, Professional, Business, Sports, Arts, Community Service)
- Beautiful gradient cards to highlight successes
- Chronological display of achievements

### 🎨 Modern Design
- Responsive design that works on all devices
- Beautiful UI with smooth animations
- Easy navigation with smooth scrolling
- Modern color scheme and typography

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser!

### Installation

1. **Clone or download this repository**
   ```bash
   cd "Kapu Rocks"
   ```

2. **Open the website**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```
   - Then visit `http://localhost:8000` in your browser

## Usage

### Adding a Business
1. Click on the "Add Your Business" button in the Businesses section
2. Fill in the business details form
3. Submit to add your business to the directory

### Scheduling a Meeting
1. Navigate to the Meetings section
2. Click "Schedule a Meeting"
3. Fill in meeting details (title, type, date, time, location)
4. Submit to add the meeting

### Sharing an Achievement
1. Go to the Achievements section
2. Click "Share an Achievement"
3. Fill in the person's name, achievement title, category, and description
4. Submit to share with the community

### Filtering Businesses
- Use the category filter buttons to filter by business type
- Use the search bar to search by business name, owner, or description

### Viewing Meetings
- Use the tabs (Upcoming, Weekly, Monthly, Past) to filter meetings
- All meetings are displayed with full details

## Data Storage

The website uses **localStorage** to store all data locally in your browser. This means:
- ✅ No server required
- ✅ Data persists between sessions
- ✅ Fast and responsive
- ⚠️ Data is stored locally on each device/browser

**Note:** If you want to share data across devices or users, you'll need to implement a backend server and database.

## File Structure

```
Kapu Rocks/
├── index.html          # Main HTML file
├── styles.css          # All styling and CSS
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #f59e0b;
    --accent-color: #10b981;
    /* ... more colors */
}
```

### Sample Data
The website comes with sample data that you can modify or remove in `script.js` in the `initializeSampleData()` function.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

Potential features to add:
- User authentication
- Backend server integration
- Database for persistent storage
- Email notifications
- Event RSVP functionality
- Photo galleries
- Community forum
- Member profiles

## Contributing

Feel free to customize this website for your community needs!

## License

This project is open source and available for community use.

## Contact

For questions or support, please contact: info@kapurocks.com

---

**Built with ❤️ for the Kapu/Balija Community**

