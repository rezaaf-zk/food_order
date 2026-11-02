# Food Order — Full-Stack Order Management & Real-Time Tracking Platform

A modern, responsive full-stack web application designed for seamless food ordering and real-time order lifecycle management. Built with a scalable client-server architecture, RESTful API standards, transactional database integrity, and containerized deployment.

## Key Engineering Highlights
* **Real-Time Order Lifecycle:** Tracks order states (`PENDING` → `PAID` → `PREPARING` → `DELIVERING` → `COMPLETED`) with low-latency UI synchronization.
* **RESTful API Architecture:** Clean separation of concerns (Controller-Service-Repository pattern), strict request payload validation, and standardized HTTP error handling.
* **Transactional Database Design:** Normalized relational schema ensuring ACID compliance during concurrent checkout and inventory updates.
* **Secure Authentication & Payment Flow:** Role-Based Access Control (RBAC) using JWT authentication alongside webhook-ready payment gateway integration.
* **Cloud & Container Ready:** Fully containerized environment using Docker and Docker Compose for reproducible local development and production deployment.

## Tech Stack
* **Frontend:** React.js, Vite, Tailwind CSS, State Management & Axios/Fetch API
* **Backend:** Node.js / FastAPI (RESTful API), JWT Authentication
* **Database:** PostgreSQL / MySQL / Supabase (with indexed relational queries)
* **DevOps & Deployment:** Docker, Docker Compose, Nginx (Reverse Proxy)

## System Architecture & Database Schema

[Client Browser (React + Vite)] 
       │
       ▼ (HTTPS / REST API + WebSockets/Polling)
[API Gateway / Nginx]
       │
       ▼
[Backend Service] ──► [Payment Gateway Webhook (e.g., Midtrans)]
       │
       ▼ (Connection Pool)
[Relational Database (Users, Menus, Orders, Order_Items, Payments)]

Local Development & Cloud Deployment
1. Clone the repository
Bash
git clone [https://github.com/rezaaf-zk/food_order.git](https://github.com/rezaaf-zk/food_order.git)
cd food_order

3. Configure Environment Variables
Create a .env file in the root/backend directory:

PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/food_order_db
JWT_SECRET=your_production_secret_key
PAYMENT_SERVER_KEY=your_payment_gateway_key
3. Run with Docker Compose (Recommended)
Bash
docker compose up --build -d
The frontend will be available at http://localhost:5173 and the REST API at http://localhost:8000.

Code Quality & Testing Standards
Input Validation: All incoming API requests are validated at the boundary layer to prevent SQL injection and malformed payloads.

Idempotency: Order creation and payment webhook handlers are designed to prevent duplicate charges on network retries.
