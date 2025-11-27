# NT TaxOffice Node - Appointment System

This branch introduces the **Appointment System** feature for the NT TaxOffice Node application. It focuses on enabling structured scheduling, managing bookings, and handling calendar availability for tax office operations.

## 🚀 Overview

The `feature/appointment-system` branch is actively being developed to provide:

* Appointment creation, updating, and cancellation
* Availability management for staff and offices
* Validation rules for overlapping appointments
* Integration with user roles and authentication
* Clear and structured API responses for front-end consumption

This branch is intended to eventually merge into `main` after full testing and validation.

## 🏗 Project Structure (Branch)

```
feature/appointment-system/
├── src/
│   ├── controllers/       # Handles appointment HTTP requests
│   ├── services/          # Business logic for scheduling
│   ├── routes/            # API routes for appointments
│   ├── middleware/        # Validation, auth, error handling
│   ├── models/            # Appointment DB models
│   └── config/            # Branch-specific configuration
├── tests/                 # Appointment-related tests
├── package.json
└── README.md
```

## 📦 Installation & Setup

Clone the repository and checkout the feature branch:

```bash
git clone https://github.com/itheCreator1/nt-taxoffice-node
cd nt-taxoffice-node
git checkout feature/appointment-system
yarn install    # or npm install
```

Set up environment variables in `.env`:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
TOKEN_SECRET=your_secret
```

## ▶️ Running the Server

```bash
yarn dev    # Runs the server in development mode
```

## 📚 Appointment System API Endpoints

* **POST /appointments** – create a new appointment
* **GET /appointments** – list appointments
* **GET /appointments/:id** – fetch specific appointment details
* **PUT /appointments/:id** – update an appointment
* **DELETE /appointments/:id** – cancel an appointment

### Notes

* Validations prevent overlapping appointments
* Responses are structured for easy front-end integration
* Role-based access control is enforced for staff and admin users

## 🧪 Tests

```bash
yarn test    # Runs appointment-related tests
```

## 🗺 Roadmap for Branch

* [ ] Finalize all validation rules
* [ ] Complete full test coverage
* [ ] Merge into `main` branch
* [ ] Add API documentation
* [ ] Ensure backward compatibility with existing system

## 🤝 Contributing

Feedback and contributions are welcome. Please open issues or pull requests.

## 📄 License

MIT License
