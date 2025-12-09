Club: Habit Tracker & Social Accountability App
Club is a modern, full-stack habit tracking application designed to help users build and maintain positive habits while fostering accountability through a social feed. Built using **React** and **Vite** for the frontend, and **Firebase** for the backend services (Authentication and Firestore).

Features
* **Habit Management (CRUD):** Users can create, read, update, and delete daily or weekly habits.
* **Progress Tracking:** Check-in functionality to track daily completion, build streaks, and record activity.
* **Authentication:** Secure user sign-up and sign-in via Firebase Authentication.
* **Social Accountability:** **Community Progress Feed** displays the latest check-ins from followed friends.
* **User Profiles:** Functionality to search for and follow/unfollow other users.
  
 Deployment
The application is deployed live on Vercel.
**Deployed URL:** `[INSERT YOUR VERCELL DEPLOYMENT URL HERE]`

Local Setup and Installation
Follow these steps to get a local copy of the project running on your machine.
### Prerequisites
* Node.js (LTS recommended)
* npm or yarn
* A Firebase Project (for backend services)
  1. Clone the Repository
```bash
git clone [https://github.com/Khushii2511/CLUB.git](https://github.com/Khushii2511/CLUB.git)
cd CLUB
2. Install Dependencies
3. Configure Firebase Environment Variables
You must create a .env file in the root directory of your project to store your Firebase configuration keys securely.
Create a file named .env in the root of your project directory.
Copy your specific Firebase configuration details into the file. Note the required VITE_ prefix for client-side access.
4. Run the Application
Start the development server

 Firebase Configuration & RulesFor the Community Progress Feed to function correctly (especially the complex where and orderBy queries), specific configurations must be set up in your Firebase Firestore.
1. Firestore Security RulesThe checkins rule must be simplified to avoid the "Missing or insufficient permissions" error caused by complex filter checks.Apply the following rules in your Firebase Console $\rightarrow$ Firestore Database $\rightarrow$ Rules tab
2. Composite IndexThe social feed query (where('userId', 'in', ...) and orderBy('timestamp', 'desc')) requires this specific composite index to run without error.Ensure this index is created and Enabled in your Firebase Console $\rightarrow$ Firestore Database $\rightarrow$ Indexes tab:Collection ID: checkinsField 1: userId (Ascending)Field 2: timestamp (Descending)
