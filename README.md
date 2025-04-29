# Task Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A powerful and intuitive task management system built with JavaScript to help individuals and teams organize, prioritize, and track their tasks efficiently.

![Task Management System Screenshot](screenshots/dashboard.png)

## 🌟 Features

- **User Authentication**: Secure login and registration system
- **Task Creation and Management**: Create, edit, delete, and organize tasks
- **Task Categories**: Group tasks by projects or categories
- **Priority Levels**: Set priority levels for tasks (High, Medium, Low)
- **Due Dates and Reminders**: Set deadlines and get notifications
- **Task Status Tracking**: Monitor progress with status updates (To Do, In Progress, Completed)
- **Search and Filter**: Find tasks quickly with advanced search options
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Data Persistence**: All tasks are saved and retrievable

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Technologies](#technologies)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/atifibrahim7/TaskManagmentSystem.git
cd TaskManagmentSystem
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory and add the necessary environment variables:

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. **Start the development server**

```bash
npm run dev
```

The application should now be running on [http://localhost:3000](http://localhost:3000).

## 🚀 Usage

### Basic Task Management

1. **Register/Login**: Create an account or log in to access your tasks
2. **Create a Task**: Click on the "Add Task" button and fill in the task details
3. **Manage Tasks**: Edit, delete, or mark tasks as completed
4. **Organize Tasks**: Categorize tasks into projects or add tags
5. **Track Progress**: View task completion statistics and progress charts

### Example Code

```javascript
// Example of creating a new task
const createNewTask = async (taskData) => {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};
```

## 💻 Technologies

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - React.js
  - Redux for state management
  - Axios for API requests
  - Material UI / Bootstrap for UI components

- **Backend**:
  - Node.js
  - Express.js
  - MongoDB for database
  - Mongoose ODM
  - JSON Web Token (JWT) for authentication

- **DevOps**:
  - Git for version control
  - npm for package management
  - Jest for testing
  - ESLint for code quality

## 📚 API Documentation

The application provides a RESTful API for task management:

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/auth/register` | POST | Register new user | `{ username, email, password }` | User object with token |
| `/api/auth/login` | POST | Login user | `{ email, password }` | User object with token |
| `/api/tasks` | GET | Get all tasks for user | - | Array of task objects |
| `/api/tasks` | POST | Create a new task | Task object | Created task object |
| `/api/tasks/:id` | GET | Get a specific task | - | Task object |
| `/api/tasks/:id` | PUT | Update a task | Task update object | Updated task object |
| `/api/tasks/:id` | DELETE | Delete a task | - | Success message |

For detailed API documentation, check out the [API Docs](docs/api.md) file.

## 📁 Project Structure

```
TaskManagmentSystem/
├── client/                 # Frontend code
│   ├── public/             # Static files
│   └── src/                # Source files
│       ├── components/     # React components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── store/          # Redux store
│       ├── styles/         # CSS/SCSS files
│       └── App.js          # Main App component
├── server/                 # Backend code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── server.js           # Entry point
├── .env                    # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and adhere to the existing coding style.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

Atif Ibrahim - [@atifibrahim7](https://github.com/atifibrahim7)

Project Link: [https://github.com/atifibrahim7/TaskManagmentSystem](https://github.com/atifibrahim7/TaskManagmentSystem)

---

Made with ❤️ by [Atif Ibrahim](https://github.com/atifibrahim7)
