# LocalPulse - Tamil Nadu Local Services Marketplace & SQLite Database

A modern, high-converting digital platform connecting customers with vetted local service professionals across Tamil Nadu (Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, etc.) including master plumbers, electricians, deep cleaners, academic tutors, and appliance technicians.

---

## 🌟 Core Features (Tamil Nadu & INR Edition)

### 1. Two-Button Clean Landing Page
- **Service Requester**: Search, compare, and book verified pros in Tamil Nadu with real-time status tracking.
- **Service Provider**: Register trade, set locality in Tamil Nadu and visiting charges in ₹ INR, and receive instant customer requests.

### 2. Relational SQLite Backend Database (`marketplace.db`)
- **`bookings` Table**:
  - **Who Booked**: Customer name, phone number, address in Tamil Nadu, and problem notes.
  - **Whom Booked**: Assigned provider name, category/trade, and service title.
  - **When Booked**: Exact ISO timestamp recorded upon request creation (`created_at`).
  - **Whether Accepted or Rejected**: Timestamped columns `accepted_at` (when provider accepts) vs `declined_at` (when provider rejects).
  - **Whether Completed & When Completed**: Timestamped column `completed_at` (recorded when provider marks the job completed).
  - **Pricing**: In Indian Rupee (**₹ INR**).
- **`booking_status_logs` Table**:
  - Full immutable chronological audit log tracking every transition (`Requested` $\rightarrow$ `Accepted` $\rightarrow$ `On The Way` $\rightarrow$ `In Progress` $\rightarrow$ `Completed` or `Declined`).
- **`providers` Table**:
  - Stores registered professionals across Tamil Nadu with their visiting charges in ₹ INR, experience, and custom rate cards.

### 3. Real-Time Provider Alert & Decision Modal
- When a customer requests a booking, a notification popup appears with an audio chime on the provider's screen.
- Provider can choose to **Accept Booking** or **Decline Request**.
- Acceptance initiates the live 4-stage tracking pipeline for the customer.

### 4. Live Tracking Pipeline (Customer View)
- Real-time 4-stage visual stepper:
  1. `Request Sent`
  2. `Pro Accepted`
  3. `On The Way / In Progress`
  4. `Job Completed`

### 5. In-App Database Inspector Modal
- Click **"Database Logs"** in the top navigation bar to inspect the raw SQLite database tables (`bookings` lifecycle with timestamps & `booking_status_logs` audit trail).

---

## 🚀 How to Run

### Option 1: Double-Click `run.bat` (Windows 1-Click)
In the project folder, double-click:
```cmd
run.bat
```
This automatically launches the Python backend server with SQLite (`marketplace.db`) and opens `http://localhost:3000` in your default browser.

### Option 2: Run via Terminal
```bash
python server.py
```
Then open:
👉 **`http://localhost:3000`**

---

## 📁 Project Structure

```text
local-services-marketplace/
├── index.html        # Clean 2-button landing, Requester/Provider views & modals
├── styles.css        # Responsive styling, tracking steppers, database table styles
├── data.js           # Seed data for Tamil Nadu locations & categories
├── app.js            # Frontend logic, state sync, SQLite REST API calls
├── server.py         # Python HTTP server & REST API with SQLite database
├── marketplace.db    # SQLite relational database file
├── run.bat           # 1-click Windows launcher
└── README.md         # Documentation & guide
```
