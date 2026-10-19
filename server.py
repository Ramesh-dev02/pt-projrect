"""
LocalPulse Tamil Nadu - Backend Server & SQLite Database
Provides REST APIs for Providers, Bookings, and Full Audit Tracking Lifecycle.
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import urllib.parse
from datetime import datetime

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PORT = 3000
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'marketplace.db')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Providers Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        phone TEXT NOT NULL,
        avatar TEXT,
        rating REAL DEFAULT 5.0,
        review_count INTEGER DEFAULT 0,
        hourly_rate REAL NOT NULL,
        city TEXT NOT NULL,
        area TEXT NOT NULL,
        location TEXT NOT NULL,
        is_verified INTEGER DEFAULT 1,
        available_today INTEGER DEFAULT 1,
        experience_years INTEGER NOT NULL,
        completed_jobs INTEGER DEFAULT 0,
        bio TEXT,
        sub_services_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Bookings Table (Stores exact timestamps for lifecycle: Booked, Accepted/Rejected, Completed)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        provider_id TEXT,
        provider_name TEXT NOT NULL,
        category TEXT NOT NULL,
        service_title TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT NOT NULL,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP,
        declined_at TIMESTAMP,
        completed_at TIMESTAMP
    )
    ''')

    # 3. Booking Status Logs Table (Audit trail of every single transition)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS booking_status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        note TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
    )
    ''')

    # Seed Initial Tamil Nadu Providers if table is empty
    cursor.execute('SELECT COUNT(*) FROM providers')
    if cursor.fetchone()[0] == 0:
        seed_providers = [
            (
                'prov-1', 'Murugan K.', 'plumber', 'Master Plumber', '+91 98401 23456',
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
                4.9, 142, 350.0, 'Chennai', 'Anna Nagar', 'Chennai (Anna Nagar & Kilpauk)', 1, 1, 12, 840,
                'Government-certified master plumber with 12+ years experience in Chennai. Specialist in CPVC/PVC pipeline leak repairs, geyser plumbing, and sanitary fittings.',
                json.dumps([
                    {'name': 'Pipe Leak & Tap Repair', 'price': 349, 'duration': '45 mins'},
                    {'name': 'Drain & Kitchen Sink Unclogging', 'price': 399, 'duration': '1 hr'},
                    {'name': 'Water Heater / Geyser Installation', 'price': 699, 'duration': '2 hrs'}
                ])
            ),
            (
                'prov-2', 'Kavitha Sundaram', 'electrician', 'Licensed Electrician', '+91 94432 19876',
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
                4.95, 188, 400.0, 'Coimbatore', 'RS Puram', 'Coimbatore (RS Puram & Gandhipuram)', 1, 1, 9, 920,
                'Certified wireman and electrical contractor serving Coimbatore. Expert in 3-phase power balancing, MCB trip diagnostics, and inverter backup installation.',
                json.dumps([
                    {'name': 'Short Circuit & MCB Trip Diagnostics', 'price': 499, 'duration': '1 hr'},
                    {'name': 'Ceiling Fan & Chandelier Fitting', 'price': 299, 'duration': '45 mins'},
                    {'name': 'Home Inverter & Double Battery Wiring', 'price': 799, 'duration': '2 hrs'}
                ])
            ),
            (
                'prov-3', 'Deepam Home Care (Lakshmi & Team)', 'cleaner', 'Deep Cleaning Specialist', '+91 98410 77654',
                'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
                4.88, 230, 300.0, 'Chennai', 'Velachery', 'Chennai (T. Nagar, Adyar & Velachery)', 1, 0, 7, 1350,
                'Eco-friendly residential & commercial deep cleaning crew across South Chennai. Single-disc floor scrubbers and hospital-grade sanitization.',
                json.dumps([
                    {'name': '2BHK Full Home Deep Cleaning', 'price': 1899, 'duration': '3-4 hrs'},
                    {'name': 'Kitchen & Chimney Degreasing', 'price': 899, 'duration': '2 hrs'},
                    {'name': 'Bathroom Acid Wash & Descaling', 'price': 599, 'duration': '1.5 hrs'}
                ])
            ),
            (
                'prov-4', 'Prof. S. Ranganathan', 'tutor', 'Maths & Physics Faculty', '+91 97890 33421',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
                4.94, 96, 350.0, 'Madurai', 'KK Nagar', 'Madurai (KK Nagar & Anna Nagar)', 1, 1, 14, 610,
                'M.Sc, M.Phil with 14 years teaching experience in Madurai. Specializing in Class 10/12 CBSE and State Board Maths and NEET/JEE Physics.',
                json.dumps([
                    {'name': 'Class 10/12 Board Exam Maths Prep', 'price': 499, 'duration': '1 hr'},
                    {'name': 'Physics Concept & Problem Solving Drill', 'price': 550, 'duration': '1 hr'}
                ])
            ),
            (
                'prov-5', 'Karthik Selvam', 'technician', 'Appliance & AC Specialist', '+91 96001 54321',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
                4.87, 115, 450.0, 'Tiruchirappalli', 'Thillai Nagar', 'Tiruchirappalli (Thillai Nagar & Cantonment)', 1, 1, 8, 780,
                'Authorized multi-brand home appliance technician serving Trichy. Inverter AC jet-servicing, washing machine motor repair, and fridge cooling.',
                json.dumps([
                    {'name': 'Split / Window AC Jet Service & Gas Check', 'price': 799, 'duration': '1.5 hrs'},
                    {'name': 'Washing Machine Drum & Motor Repair', 'price': 649, 'duration': '1.5 hrs'}
                ])
            )
        ]
        cursor.executemany('''
        INSERT INTO providers (
            id, name, category, category_label, phone, avatar, rating, review_count,
            hourly_rate, city, area, location, is_verified, available_today,
            experience_years, completed_jobs, bio, sub_services_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_providers)

    # Seed Initial Sample Bookings if empty
    cursor.execute('SELECT COUNT(*) FROM bookings')
    if cursor.fetchone()[0] == 0:
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        seed_bookings = [
            (
                'BK-9842', 'prov-1', 'Murugan K.', 'plumber', 'Pipe Leak & Tap Repair',
                '2026-10-19', '10:00 AM - 12:00 PM', 'Anandhi Ramanathan', '+91 98402 34567',
                'Plot 45, 3rd Avenue, Anna Nagar East, Chennai - 600102', 398.0, 'Accepted',
                'Leakage under kitchen sink cupboard', now_str, now_str, None, None
            )
        ]
        cursor.executemany('''
        INSERT INTO bookings (
            id, provider_id, provider_name, category, service_title, booking_date,
            time_slot, customer_name, customer_phone, customer_address, total_price,
            status, special_instructions, created_at, accepted_at, declined_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_bookings)

        cursor.execute('''
        INSERT INTO booking_status_logs (booking_id, status, timestamp, note)
        VALUES ('BK-9842', 'Requested', ?, 'Customer submitted service request')
        ''', (now_str,))
        cursor.execute('''
        INSERT INTO booking_status_logs (booking_id, status, timestamp, note)
        VALUES ('BK-9842', 'Accepted', ?, 'Provider accepted booking request')
        ''', (now_str,))

    conn.commit()
    conn.close()
    print(f"✅ SQLite Database initialized at: {DB_FILE}")

class MarketplaceHandler(http.server.SimpleHTTPRequestHandler):
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path

        # REST API: GET /api/providers
        if path == '/api/providers':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM providers ORDER BY created_at DESC')
            rows = cursor.fetchall()
            providers = []
            for r in rows:
                p = dict(r)
                p['isVerified'] = bool(p['is_verified'])
                p['availableToday'] = bool(p['available_today'])
                p['hourlyRate'] = p['hourly_rate']
                p['experienceYears'] = p['experience_years']
                p['completedJobs'] = p['completed_jobs']
                p['reviewCount'] = p['review_count']
                try:
                    p['subServices'] = json.loads(p['sub_services_json'] or '[]')
                except Exception:
                    p['subServices'] = []
                p['reviews'] = [{'author': 'Client Review', 'rating': int(p['rating']), 'date': 'Recent', 'comment': 'Highly verified service provider in Tamil Nadu.'}]
                providers.append(p)
            conn.close()
            return self.send_json(providers)

        # REST API: GET /api/bookings
        if path == '/api/bookings':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM bookings ORDER BY created_at DESC')
            rows = cursor.fetchall()
            bookings = []
            for r in rows:
                b = dict(r)
                b['totalPrice'] = b['total_price']
                b['customerName'] = b['customer_name']
                b['customerPhone'] = b['customer_phone']
                b['customerAddress'] = b['customer_address']
                b['providerName'] = b['provider_name']
                b['serviceTitle'] = b['service_title']
                b['timeSlot'] = b['time_slot']
                b['specialInstructions'] = b['special_instructions']
                b['createdAt'] = b['created_at']
                b['acceptedAt'] = b['accepted_at']
                b['declinedAt'] = b['declined_at']
                b['completedAt'] = b['completed_at']
                b['providerId'] = b.get('provider_id', '')
                b['date'] = b.get('booking_date', '')

                # Fetch status logs for this booking
                log_cursor = conn.cursor()
                log_cursor.execute('SELECT * FROM booking_status_logs WHERE booking_id = ? ORDER BY id ASC', (b['id'],))
                logs = []
                for lr in log_cursor.fetchall():
                    ld = dict(lr)
                    ld['time'] = ld['timestamp']
                    logs.append(ld)
                b['statusHistory'] = logs
                bookings.append(b)
            conn.close()
            return self.send_json(bookings)

        # REST API: GET /api/db/export (Full inspection of all raw SQL tables)
        if path == '/api/db/export':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM bookings ORDER BY created_at DESC')
            bookings = [dict(r) for r in cursor.fetchall()]
            cursor.execute('SELECT * FROM booking_status_logs ORDER BY id DESC')
            logs = [dict(r) for r in cursor.fetchall()]
            cursor.execute('SELECT * FROM providers ORDER BY created_at DESC')
            providers = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self.send_json({
                'database': DB_FILE,
                'total_bookings': len(bookings),
                'total_providers': len(providers),
                'bookings': bookings,
                'status_logs': logs,
                'providers': providers
            })

        # Default to standard static file serving
        return super().do_GET()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(length)
        try:
            body = json.loads(post_data.decode('utf-8'))
        except Exception:
            body = {}

        # REST API: POST /api/providers (Register provider into SQLite)
        if path == '/api/providers':
            conn = get_db()
            cursor = conn.cursor()
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            sub_json = json.dumps(body.get('subServices', []))
            prov_id = body.get('id') or f"prov-{int(datetime.now().timestamp() * 1000)}"

            cursor.execute('''
            INSERT INTO providers (
                id, name, category, category_label, phone, avatar, rating, review_count,
                hourly_rate, city, area, location, is_verified, available_today,
                experience_years, completed_jobs, bio, sub_services_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                prov_id,
                body.get('name', 'Professional'),
                body.get('category', 'plumber'),
                body.get('categoryLabel', 'Service Pro'),
                body.get('phone', ''),
                body.get('avatar', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256'),
                body.get('rating', 5.0),
                body.get('reviewCount', 1),
                float(body.get('hourlyRate', 350)),
                body.get('city', 'Chennai'),
                body.get('area', 'Anna Nagar'),
                body.get('location', f"{body.get('city', 'Chennai')} ({body.get('area', '')})"),
                1 if body.get('isVerified', True) else 0,
                1 if body.get('availableToday', True) else 0,
                int(body.get('experienceYears', 5)),
                int(body.get('completedJobs', 1)),
                body.get('bio', ''),
                sub_json,
                now_str
            ))
            conn.commit()
            conn.close()
            body['id'] = prov_id
            body['created_at'] = now_str
            print(f"✅ [SQLite] New Provider Registered: {body.get('name')} in {body.get('location')}")
            return self.send_json({'success': True, 'provider': body}, status=201)

        # REST API: POST /api/bookings (Create Customer Booking into SQLite)
        if path == '/api/bookings':
            conn = get_db()
            cursor = conn.cursor()
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            booking_id = body.get('id') or f"BK-{int(1000 + (datetime.now().timestamp() % 9000))}"

            cursor.execute('''
            INSERT INTO bookings (
                id, provider_id, provider_name, category, service_title, booking_date,
                time_slot, customer_name, customer_phone, customer_address, total_price,
                status, special_instructions, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                booking_id,
                body.get('providerId', ''),
                body.get('providerName', 'Service Pro'),
                body.get('category', 'general'),
                body.get('serviceTitle', 'Service Appointment'),
                body.get('date', datetime.now().strftime('%Y-%m-%d')),
                body.get('timeSlot', 'Afternoon (02:00 PM - 04:00 PM)'),
                body.get('customerName', 'Customer'),
                body.get('customerPhone', ''),
                body.get('customerAddress', 'Tamil Nadu'),
                float(body.get('totalPrice', 399)),
                'Requested',
                body.get('specialInstructions', ''),
                now_str
            ))

            # Record initial audit tracking log
            cursor.execute('''
            INSERT INTO booking_status_logs (booking_id, status, timestamp, note)
            VALUES (?, 'Requested', ?, 'Customer submitted service request')
            ''', (booking_id, now_str))

            conn.commit()
            conn.close()

            body['id'] = booking_id
            body['status'] = 'Requested'
            body['createdAt'] = now_str
            print(f"✅ [SQLite] New Booking Created: {booking_id} for {body.get('providerName')} by {body.get('customerName')} at {now_str}")
            return self.send_json({'success': True, 'booking': body}, status=201)

        return self.send_json({'error': 'Not found'}, status=404)

    def do_PUT(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path
        length = int(self.headers.get('Content-Length', 0))
        put_data = self.rfile.read(length)
        try:
            body = json.loads(put_data.decode('utf-8'))
        except Exception:
            body = {}

        # REST API: PUT /api/bookings/<id>/status
        # Tracks whether Accepted, Declined, On The Way, In Progress, Completed, with exact timestamps!
        if path.startswith('/api/bookings/') and path.endswith('/status'):
            parts = path.split('/')
            booking_id = parts[3]
            new_status = body.get('status')
            note = body.get('note', '')

            conn = get_db()
            cursor = conn.cursor()
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # Determine timestamp column to update
            if new_status == 'Accepted':
                cursor.execute('UPDATE bookings SET status = ?, accepted_at = ? WHERE id = ?', (new_status, now_str, booking_id))
                if not note: note = 'Provider ACCEPTED the customer booking request'
            elif new_status == 'Declined':
                cursor.execute('UPDATE bookings SET status = ?, declined_at = ? WHERE id = ?', (new_status, now_str, booking_id))
                if not note: note = 'Provider DECLINED the booking request'
            elif new_status == 'Completed':
                cursor.execute('UPDATE bookings SET status = ?, completed_at = ? WHERE id = ?', (new_status, now_str, booking_id))
                if not note: note = 'Service work was fully COMPLETED. Final invoice generated.'
            else:
                cursor.execute('UPDATE bookings SET status = ? WHERE id = ?', (new_status, booking_id))
                if not note: note = f'Status advanced to {new_status}'

            # Insert into audit log
            cursor.execute('''
            INSERT INTO booking_status_logs (booking_id, status, timestamp, note)
            VALUES (?, ?, ?, ?)
            ''', (booking_id, new_status, now_str, note))

            conn.commit()

            # Retrieve updated row
            cursor.execute('SELECT * FROM bookings WHERE id = ?', (booking_id,))
            updated_row = cursor.fetchone()
            conn.close()

            if updated_row:
                b = dict(updated_row)
                print(f"✅ [SQLite] Status Updated for {booking_id} -> {new_status} at {now_str}")
                return self.send_json({'success': True, 'booking': b})
            else:
                return self.send_json({'error': 'Booking not found'}, status=404)

        return self.send_json({'error': 'Not found'}, status=404)

if __name__ == '__main__':
    init_database()
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), MarketplaceHandler) as httpd:
        print(f"🚀 LocalPulse Backend Server & SQLite Database running at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
