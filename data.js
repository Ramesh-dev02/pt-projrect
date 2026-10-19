// Local Services Marketplace - Seed Data & Configurations (Tamil Nadu & INR Edition)

const TAMIL_NADU_LOCATIONS = [
  { city: 'Chennai', areas: ['Anna Nagar', 'T. Nagar', 'Velachery', 'Adyar', 'Mylapore', 'OMR (IT Corridor)', 'Tambaram', 'Porur', 'Ambattur', 'Kilpauk'] },
  { city: 'Coimbatore', areas: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Saravanampatti', 'Race Course'] },
  { city: 'Madurai', areas: ['KK Nagar', 'Anna Nagar', 'Simmakkal', 'Goripalayam', 'Mattuthavani', 'Ponmeni'] },
  { city: 'Tiruchirappalli', areas: ['Thillai Nagar', 'Cantonment', 'Srirangam', 'KK Nagar', 'Palakkarai'] },
  { city: 'Salem', areas: ['Fairlands', 'Hasthampatti', 'Meyyanur', 'Suramangalam', 'Alagapuram'] },
  { city: 'Tirunelveli', areas: ['Palayamkottai', 'Tirunelveli Junction', 'Vannarpettai', 'Town'] },
  { city: 'Erode', areas: ['Brough Road', 'Thindal', 'Perundurai Road', 'Solar'] },
  { city: 'Vellore', areas: ['Katpadi', 'Bagayam', 'Gandhi Nagar', 'Sathuvachari'] },
  { city: 'Thanjavur', areas: ['Medical College Road', 'Old Bus Stand', 'South Rampart'] },
  { city: 'Tiruppur', areas: ['Avinashi Road', 'Kumar Nagar', 'Rayapuram'] }
];

const SERVICE_CATEGORIES = [
  { id: 'all', name: 'All Services', icon: 'fa-shapes' },
  { id: 'plumber', name: 'Plumber', icon: 'fa-wrench' },
  { id: 'electrician', name: 'Electrician', icon: 'fa-bolt' },
  { id: 'cleaner', name: 'Cleaner', icon: 'fa-broom' },
  { id: 'tutor', name: 'Tutor', icon: 'fa-graduation-cap' },
  { id: 'technician', name: 'Technician', icon: 'fa-screwdriver-wrench' },
  { id: 'carpenter', name: 'Carpenter', icon: 'fa-hammer' },
  { id: 'painter', name: 'Painter', icon: 'fa-paint-roller' }
];

const INITIAL_PROVIDERS = [
  {
    id: 'prov-1',
    name: 'Murugan K.',
    category: 'plumber',
    categoryLabel: 'Master Plumber',
    phone: '+91 98401 23456',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
    rating: 4.9,
    reviewCount: 142,
    hourlyRate: 350,
    city: 'Chennai',
    area: 'Anna Nagar',
    location: 'Chennai (Anna Nagar & Kilpauk)',
    isVerified: true,
    availableToday: true,
    experienceYears: 12,
    completedJobs: 840,
    bio: 'Government-certified master plumber with 12+ years experience in Chennai. Specialist in CPVC/PVC pipeline leak repairs, geyser plumbing, water tank overflow prevention, and sanitary fittings.',
    subServices: [
      { name: 'Pipe Leak & Tap Repair', price: 349, duration: '45 mins' },
      { name: 'Drain & Kitchen Sink Unclogging', price: 399, duration: '1 hr' },
      { name: 'Water Heater / Geyser Installation', price: 699, duration: '2 hrs' },
      { name: 'Bathroom Commode & Flush Valve Fitting', price: 449, duration: '1 hr' }
    ],
    reviews: [
      { author: 'Anandhi R.', rating: 5, date: '2 days ago', comment: 'Murugan arrived at our Anna Nagar flat within 30 minutes and resolved the kitchen pipe leak neatly.' },
      { author: 'Karthik Raja', rating: 5, date: '1 week ago', comment: 'Fixed our geyser inlet line properly. Very reasonable and polite.' }
    ]
  },
  {
    id: 'prov-2',
    name: 'Kavitha Sundaram',
    category: 'electrician',
    categoryLabel: 'Licensed Electrician',
    phone: '+91 94432 19876',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    rating: 4.95,
    reviewCount: 188,
    hourlyRate: 400,
    city: 'Coimbatore',
    area: 'RS Puram',
    location: 'Coimbatore (RS Puram & Gandhipuram)',
    isVerified: true,
    availableToday: true,
    experienceYears: 9,
    completedJobs: 920,
    bio: 'Certified wireman and electrical contractor serving Coimbatore. Expert in 3-phase power balancing, MCB trip diagnostics, and inverter backup installation.',
    subServices: [
      { name: 'Short Circuit & MCB Trip Diagnostics', price: 499, duration: '1 hr' },
      { name: 'Ceiling Fan & Chandelier Fitting', price: 299, duration: '45 mins' },
      { name: 'Home Inverter & Double Battery Wiring', price: 799, duration: '2 hrs' },
      { name: 'Full House Electrical Safety Inspection', price: 1299, duration: '3 hrs' }
    ],
    reviews: [
      { author: 'Senthil Velan', rating: 5, date: 'Yesterday', comment: 'Detected a dangerous neutral wire leakage in our RS Puram house that previous electricians missed.' }
    ]
  },
  {
    id: 'prov-3',
    name: 'Deepam Home Care (Lakshmi & Team)',
    category: 'cleaner',
    categoryLabel: 'Deep Cleaning Specialist',
    phone: '+91 98410 77654',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
    rating: 4.88,
    reviewCount: 230,
    hourlyRate: 300,
    city: 'Chennai',
    area: 'Velachery',
    location: 'Chennai (T. Nagar, Adyar & Velachery)',
    isVerified: true,
    availableToday: false,
    experienceYears: 7,
    completedJobs: 1350,
    bio: 'Eco-friendly residential & commercial deep cleaning crew across South Chennai. Industrial single-disc floor scrubbers, HEPA vacuum filters, and organic descaling agents.',
    subServices: [
      { name: '2BHK Full Home Deep Cleaning', price: 1899, duration: '3-4 hrs' },
      { name: 'Kitchen & Chimney Exhaust Degreasing', price: 899, duration: '2 hrs' },
      { name: 'Bathroom Hard Water Tile Scrub & Acid Wash', price: 599, duration: '1.5 hrs' },
      { name: 'Sofa & Mattress Upholstery Shampoo Wash', price: 799, duration: '2 hrs' }
    ],
    reviews: [
      { author: 'Divya Bharathi', rating: 5, date: '3 days ago', comment: 'Our Velachery apartment looks brand new. The bathroom tile descaling was miraculous!' }
    ]
  },
  {
    id: 'prov-4',
    name: 'Prof. S. Ranganathan',
    category: 'tutor',
    categoryLabel: 'Maths & Physics Faculty',
    phone: '+91 97890 33421',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    rating: 4.94,
    reviewCount: 96,
    hourlyRate: 350,
    city: 'Madurai',
    area: 'KK Nagar',
    location: 'Madurai (KK Nagar & Anna Nagar)',
    isVerified: true,
    availableToday: true,
    experienceYears: 14,
    completedJobs: 610,
    bio: 'M.Sc, M.Phil with 14 years teaching experience in Madurai. Specializing in Class 10/12 CBSE and Tamil Nadu State Board (Samacheer Kalvi) Mathematics and JEE/NEET Physics problem solving.',
    subServices: [
      { name: 'Class 10/12 Board Exam Maths Prep', price: 499, duration: '1 hr' },
      { name: 'Physics Concept & Problem Solving Drill', price: 550, duration: '1 hr' },
      { name: 'JEE / NEET Foundation Module', price: 750, duration: '1.5 hrs' }
    ],
    reviews: [
      { author: 'Subramanian C.', rating: 5, date: '4 days ago', comment: 'Helped my daughter score 96% in 12th Board Mathematics.' }
    ]
  },
  {
    id: 'prov-5',
    name: 'Karthik Selvam',
    category: 'technician',
    categoryLabel: 'Appliance & AC Specialist',
    phone: '+91 96001 54321',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    rating: 4.87,
    reviewCount: 115,
    hourlyRate: 450,
    city: 'Tiruchirappalli',
    area: 'Thillai Nagar',
    location: 'Tiruchirappalli (Thillai Nagar & Cantonment)',
    isVerified: true,
    availableToday: true,
    experienceYears: 8,
    completedJobs: 780,
    bio: 'Authorized multi-brand home appliance technician serving Trichy. Expert in Inverter Split AC jet-pump servicing, PCB board debugging, and front-load washing machine repairs.',
    subServices: [
      { name: 'Split / Window AC Jet Service & Gas Check', price: 799, duration: '1.5 hrs' },
      { name: 'Washing Machine Drum & Motor Repair', price: 649, duration: '1.5 hrs' },
      { name: 'Double Door Refrigerator Cooling Fix', price: 799, duration: '2 hrs' }
    ],
    reviews: [
      { author: 'Aravind S.', rating: 5, date: 'Yesterday', comment: 'Jet pump foam wash for our AC made cooling instant and silent.' }
    ]
  },
  {
    id: 'prov-6',
    name: 'Venkatesh Babu',
    category: 'electrician',
    categoryLabel: 'Lighting & Power Technician',
    phone: '+91 98944 11223',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256',
    rating: 4.91,
    reviewCount: 164,
    hourlyRate: 350,
    city: 'Salem',
    area: 'Fairlands',
    location: 'Salem (Fairlands & Hasthampatti)',
    isVerified: true,
    availableToday: true,
    experienceYears: 10,
    completedJobs: 1120,
    bio: 'Experienced electrician catering to Salem homes, shops, and offices. Expertise in concealed LED lighting, heavy AC point wiring, and main meter board dressing.',
    subServices: [
      { name: 'Emergency Fuse & Circuit Trip Repair', price: 399, duration: '45 mins' },
      { name: 'Concealed LED Strip & False Ceiling Lights', price: 599, duration: '2 hrs' },
      { name: 'Main Distribution Box / DB Dressing', price: 649, duration: '2 hrs' }
    ],
    reviews: [
      { author: 'Naveen Kumar', rating: 5, date: '1 week ago', comment: 'Handled our shop lighting revamp in Salem Fairlands. Very neat work.' }
    ]
  }
];

const INITIAL_BOOKINGS = [
  {
    id: 'BK-9842',
    providerId: 'prov-1',
    providerName: 'Murugan K.',
    category: 'plumber',
    serviceTitle: 'Pipe Leak & Tap Repair',
    date: '2026-10-19',
    timeSlot: '10:00 AM - 12:00 PM',
    customerName: 'Anandhi Ramanathan',
    customerPhone: '+91 98402 34567',
    customerCity: 'Chennai',
    customerArea: 'Anna Nagar',
    customerAddress: 'Plot 45, 3rd Avenue, Anna Nagar East, Chennai - 600102',
    totalPrice: 398, // 349 + 49
    status: 'In Progress', // Requested, Accepted, On The Way, In Progress, Completed, Declined
    specialInstructions: 'Leakage under the double kitchen sink cupboard.',
    createdAt: '2026-10-18T10:30:00Z',
    statusHistory: [
      { status: 'Requested', time: '10:30 AM', note: 'Booking submitted by customer' },
      { status: 'Accepted', time: '10:35 AM', note: 'Provider accepted the booking request' },
      { status: 'On The Way', time: '10:50 AM', note: 'Murugan K. is en route to Anna Nagar' },
      { status: 'In Progress', time: '11:15 AM', note: 'Technician arrived and began pipe repair' }
    ]
  },
  {
    id: 'BK-9811',
    providerId: 'prov-2',
    providerName: 'Kavitha Sundaram',
    category: 'electrician',
    serviceTitle: 'Short Circuit & MCB Trip Diagnostics',
    date: '2026-10-19',
    timeSlot: '02:00 PM - 04:00 PM',
    customerName: 'Senthil Velan',
    customerPhone: '+91 94432 19876',
    customerCity: 'Coimbatore',
    customerArea: 'RS Puram',
    customerAddress: '12, Crosscut Road, Gandhipuram, Coimbatore - 641012',
    totalPrice: 548,
    status: 'Accepted',
    specialInstructions: 'Main MCB trips whenever the microwave turns on.',
    createdAt: '2026-10-18T09:15:00Z',
    statusHistory: [
      { status: 'Requested', time: '09:15 AM', note: 'Booking submitted by customer' },
      { status: 'Accepted', time: '09:20 AM', note: 'Provider accepted the booking request' }
    ]
  }
];
