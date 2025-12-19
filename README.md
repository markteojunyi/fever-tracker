# 🌡️ Fever Tracker

A web application designed to help parents track their children's temperature and medication during illness. Built to simplify the process of monitoring fever patterns and managing medication schedules.

## 📋 About

Fever Tracker is a minimal viable product (MVP) created to solve a common parenting challenge: keeping accurate records of a sick child's temperature readings and medication doses. The app provides an easy-to-use interface for logging temperatures, tracking medication schedules, and visualizing fever trends over time.

## ✨ Key Features

### Temperature Tracking

- Log temperature readings with timestamps
- Visual graph showing temperature trends over time
- Support for both Celsius and Fahrenheit
- High fever alerts (>39°C)
- Fever trend indicators (improving/stable/worsening)

### Medication Management

- Add medications prescribed by doctors with dosage details
- Track medication frequency and maximum daily doses
- Log when medication is given to the child
- Overdose prevention warnings
- View medication history with ability to delete incorrect entries
- Track who administered each dose (Mom, Dad, etc.)

### Child Management

- Support for multiple children
- Easy switching between children
- Individual tracking for each child

### User Interface

- Clean, mobile-friendly design
- Real-time status updates
- Color-coded alerts for high fever or worsening trends
- Simple data visualization

## 🛠️ Technology Stack

### Frontend

- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom React components

### Backend

- **Framework:** Next.js API Routes
- **Language:** TypeScript
- **Runtime:** Node.js

### Database

- **Database:** MongoDB
- **ODM:** Mongoose
- **Hosting:** MongoDB Atlas (cloud)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd fever-tracker
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory:

```
MONGODB_URI=your_mongodb_connection_string
```

4. Run the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📱 Usage

1. **Add a child** - Start by adding your child's information
2. **Log temperature** - Record temperature readings throughout the day
3. **Add medications** - Input medications prescribed by the doctor with dosage instructions
4. **Track doses** - Log each time you give medication to your child
5. **Monitor trends** - View the temperature graph to track fever patterns

## 🔒 Data Privacy

This application stores data in a private MongoDB database. Each family's data is isolated and secure. The app is designed for personal/family use.

## 📝 License

This project is for personal use.

## 👨‍💻 Author

Created as a personal project to help manage children's health during illness.

## 🙏 Acknowledgments

Built with guidance from Claude (Anthropic) for learning purposes.
