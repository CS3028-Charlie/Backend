# The Sustainables Academy E-card Backend

## Overview

Backend server for the Sustainables Academy card website - an eco-friendly digital and printable greeting card platform supporting environmental education.

Handles user authentication, card customization drafts, classroom management for teachers, card purchasing (e-cards and printables), payment processing via PayPal, and template management.

## Features

* **User Management:** Registration, login, profile retrieval, balance checking, account deletion. Supports roles: `pupil`, `teacher`, `parent`, `admin`.
* **Authentication:** JWT-based authentication for protected routes.
* **Classroom Management (Teachers):** View students, add/remove students from class, add credits to students, withdraw credits from students.
* **Card Drafts:** Save, retrieve, update, and delete card customization drafts for logged-in users.
* **Card Purchasing:** Purchase e-cards or printables using user credits.
* **Payment Processing:** Securely create and capture orders using the PayPal API.
* **Template Management:** Upload, retrieve previews, and delete card templates stored as assets.

## Technology Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB with Mongoose ODM
* **Authentication:** JSON Web Tokens (JWT)
* **Password Hashing:** bcrypt
* **Payments:** PayPal Server SDK
* **File Handling:** Multer (for uploads)
* **Environment Variables:** dotenv
* **CORS:** cors middleware

## Prerequisites

* Node.js (v18 or later recommended)
* npm (Node Package Manager)
* MongoDB instance (local or cloud-hosted)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/CS3028-Charlie/Backend.git](https://github.com/CS3028-Charlie/Backend.git)
    cd Backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create Environment File:**
    Create a `.env` file in the root directory and add the following environment variables:
    ```dotenv
    # Server Configuration
    PORT=3000 # Or any port you prefer

    # MongoDB Connection
    MONGO_URI=your_mongodb_connection_string # Replace with your MongoDB connection URI

    # JWT Authentication
    JWT_SECRET=your_strong_jwt_secret # Replace with a strong, unique secret key

    # PayPal API Credentials (Sandbox or Production)
    PAYPAL_CLIENT_ID=your_paypal_client_id
    PAYPAL_CLIENT_SECRET=your_paypal_client_secret
    ```

4.  **Run the server:**
    ```bash
    npm start
    ```
    Or for development with automatic restarts (if nodemon is installed):
    ```bash
    nodemon index.js
    ```
    The server should now be running on the port specified in your `.env` file (defaulting to 3000).

## API Endpoints

* **Authentication (`/api/auth`)**:
    * `POST /register`: Register a new user.
    * `POST /login`: Log in a user and receive a JWT.
    * `GET /user`: Get the logged-in user's details (requires authentication).
    * `GET /balance`: Get the logged-in user's credit balance (requires authentication).
    * `POST /topup`: (Teachers/Parents only) Add credits to a pupil's account.
    * `POST /deduct`: Deduct credits from the logged-in user's own account.
    * `DELETE /delete-account`: Delete the logged-in user's account (requires password confirmation).
* **Classroom Management (`/api/classroom`)**: (Teacher role required)
    * `GET /students`: Get students in the teacher's class.
    * `POST /add-student`: Add a student (by email) to the teacher's class.
    * `DELETE /remove-students`: Remove students (by email) from the teacher's class.
    * `POST /add-credits`: Add credits to selected students in the class.
    * `POST /withdraw-credits`: Withdraw all credits from selected students and add to the teacher's balance.
* **Card Purchasing (`/api/cardPurchase`)**:
    * `POST /purchase`: Purchase a card, deducting credits (requires authentication).
* **Drafts (`/api/drafts`)**: (Requires authentication)
    * `GET /`: Get all drafts for the logged-in user.
    * `GET /:id`: Get a specific draft by ID.
    * `POST /`: Create a new draft.
    * `PUT /:id`: Update an existing draft.
    * `DELETE /:id`: Delete a draft.
* **Payments (`/api/payment`)**:
    * `POST /orders`: Create a PayPal order.
    * `POST /orders/:orderID/capture`: Capture payment for a PayPal order.
* **Template Management (Root Level)**:
    * `GET /get_card_previews`: Get a list of available card template folders.
    * `GET /assets/templates/count`: Get the number of card templates.
    * `POST /delete_card`: Delete a card template folder and its contents.
    * `POST /upload_card`: Upload images for a new card template.
* **Static Assets (`/assets`)**:
    * Serves static files (e.g., template images).