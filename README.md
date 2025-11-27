# NT TaxOffice Node

A modern Node.js application built for managing tax office workflows, designed with scalability, modularity, and real-world business logic in mind. The project currently includes a stable main branch and an active development branch focused on expanding functionality.

## 🚀 Overview

NT TaxOffice Node is a backend service built with **Node.js** and **Express**, offering structured APIs for:

* User and role management
* Appointments and scheduling
* Authentication flows
* Database operations using modern patterns

The project is designed to be easy to extend and maintain, featuring clean architecture, modular routing, and organized controller/service layers.

## 🌿 Active Development Branch: `feature/appointment-system`

A major upcoming feature is under development in the `feature/appointment-system` branch. This branch includes:

* Full appointment booking system
* Calendar & availability logic
* Appointment validation rules
* Improved error handling and response structure
* Cleaner service patterns

This branch refactors parts of the existing project and adds new modules that will soon be merged into `main`.

You can explore the branch here:
`feature/appointment-system`

## 🏗 Project Structure

```
nt-taxoffice-node/
├── src/
│   ├── controllers/       # Request handling
│   ├── services/          # Business logic
│   ├── routes/            # Express routing
│   ├── middleware/        # Auth, validation, etc.
│   ├── models/            # Database models
│   └── config/            # Environment & database config
├── tests/                 # Future test suite
├── package.json
└── README.md
```

## 📦 Installation

```bash
git clone https://github.com/itheCreator1/nt-taxoffice-node
yarn install    # or npm install
```

### Environment Setup

Create a `.env` file:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
TOKEN_SECRET=your_secret
```

## ▶️ Running the Server

Development mode:

```bash
yarn dev
```

Production mode:

```bash
yarn start
```

## 📚 API Highlights

* **Auth API** – login, token validation
* **Users API** – create, update, delete, roles
* **Appointments API** *(in feature branch)* – book, cancel, fetch schedule

Detailed documentation will be added after the appointment system merge.

## 🧪 Tests

Test suite will be expanded in upcoming versions.
Run tests (if present):

```bash
yarn test
```

## 🗺 Roadmap

* [ ] Finalize appointment system
* [ ] Merge feature branch into main
* [ ] Add complete API documentation
* [ ] Add automated tests
* [ ] Docker support
* [ ] CI/CD integration

## 🤝 Contributing

Contributions and feedback are welcome. Open issues or pull requests for improvements.

## 📄 License

MIT License
