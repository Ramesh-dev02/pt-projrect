// Local Services Marketplace - Core Application Logic (Tamil Nadu & INR Edition)

class MarketplaceApp {
  constructor() {
    this.providers = this.loadProviders();
    this.bookings = this.loadBookings();
    this.activeProvider = this.providers[0] || null;
    this.currentView = 'first_page'; // 'first_page', 'requester', 'provider'
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.locationFilter = 'all';
    this.availableTodayOnly = false;
    this.sortBy = 'recommended';
    this.selectedProvider = null;
    this.pendingIncomingBooking = null;

    this.init();
  }

  // LocalStorage Persistence
  loadProviders() {
    const saved = localStorage.getItem('localpulse_tn_providers_v4');
    return saved ? JSON.parse(saved) : INITIAL_PROVIDERS;
  }

  saveProviders() {
    localStorage.setItem('localpulse_tn_providers_v4', JSON.stringify(this.providers));
    window.dispatchEvent(new CustomEvent('localpulse_storage_changed'));
  }

  loadBookings() {
    const saved = localStorage.getItem('localpulse_tn_bookings_v4');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  }

  saveBookings() {
    localStorage.setItem('localpulse_tn_bookings_v4', JSON.stringify(this.bookings));
    window.dispatchEvent(new CustomEvent('localpulse_storage_changed'));
  }

  init() {
    this.setupCrossTabSync();
    this.setupDateConstraints();
    this.updateMyBookingsBadge();
    this.attachDomEvents();

    // Start with the clean first page (ONLY TWO BUTTONS)
    this.showFirstPage();

    // Synchronize immediately with SQLite backend database
    this.syncWithBackend();
    setInterval(() => this.syncWithBackend(), 4000);
  }

  async syncWithBackend() {
    try {
      const [provRes, bookRes] = await Promise.all([
        fetch('/api/providers'),
        fetch('/api/bookings')
      ]);

      if (provRes.ok) {
        const provData = await provRes.json();
        if (Array.isArray(provData) && provData.length > 0) {
          this.providers = provData;
          localStorage.setItem('localpulse_tn_providers_v4', JSON.stringify(this.providers));
          if (!this.activeProvider || !this.providers.find(p => p.id === this.activeProvider.id)) {
            this.activeProvider = this.providers[0];
          }
        }
      }

      if (bookRes.ok) {
        const bookData = await bookRes.json();
        if (Array.isArray(bookData)) {
          this.bookings = bookData;
          localStorage.setItem('localpulse_tn_bookings_v4', JSON.stringify(this.bookings));
        }
      }

      this.updateMyBookingsBadge();
      if (this.currentView === 'requester') {
        this.renderRequesterProviders();
      } else if (this.currentView === 'provider') {
        this.renderProviderDashboard();
      }

      const myBookingsModal = document.getElementById('my-bookings-modal');
      if (myBookingsModal && myBookingsModal.classList.contains('active')) {
        this.openMyBookingsModal();
      }
    } catch (err) {
      // Quiet fallback if server is offline or local file mode
    }
  }

  attachDomEvents() {
    const reqBtn = document.querySelector('.requester-btn-card');
    if (reqBtn) {
      reqBtn.onclick = (e) => {
        if (e) e.preventDefault();
        this.openRequesterView();
      };
    }

    const provBtn = document.querySelector('.provider-btn-card');
    if (provBtn) {
      provBtn.onclick = (e) => {
        if (e) e.preventDefault();
        this.openProviderFlow();
      };
    }
  }

  setupCrossTabSync() {
    const syncHandler = () => {
      this.bookings = this.loadBookings();
      this.providers = this.loadProviders();
      this.updateMyBookingsBadge();

      if (this.currentView === 'provider') {
        this.renderProviderDashboard();
      } else if (this.currentView === 'requester') {
        this.renderRequesterProviders();
      }

      const myBookingsModal = document.getElementById('my-bookings-modal');
      if (myBookingsModal && myBookingsModal.classList.contains('active')) {
        this.openMyBookingsModal();
      }
    };

    window.addEventListener('storage', syncHandler);
    window.addEventListener('localpulse_storage_changed', syncHandler);
  }

  setupDateConstraints() {
    const dateInput = document.getElementById('book-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }
  }

  // ========================================================
  // ROUTING: FIRST PAGE (ONLY TWO BUTTONS)
  // ========================================================
  showFirstPage() {
    this.currentView = 'first_page';
    document.getElementById('first-page-view').style.display = 'block';
    document.getElementById('provider-flow-view').style.display = 'none';
    document.getElementById('requester-flow-view').style.display = 'none';

    document.getElementById('btn-back-home').style.display = 'none';
    document.getElementById('nav-mode-badge').style.display = 'none';
    document.getElementById('btn-track-bookings').style.display = 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========================================================
  // OPTION 1: SERVICE REQUESTER FLOW
  // ========================================================
  openRequesterView() {
    this.currentView = 'requester';
    document.getElementById('first-page-view').style.display = 'none';
    document.getElementById('provider-flow-view').style.display = 'none';
    document.getElementById('requester-flow-view').style.display = 'block';

    document.getElementById('btn-back-home').style.display = 'inline-flex';
    
    const modeBadge = document.getElementById('nav-mode-badge');
    modeBadge.className = 'current-role-pill';
    modeBadge.style.display = 'inline-flex';
    document.getElementById('nav-mode-text').innerHTML = '<i class="fa-solid fa-user"></i> Service Requester';

    document.getElementById('btn-track-bookings').style.display = 'inline-flex';

    this.renderCategoryChips();
    this.renderRequesterProviders();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast('Entered Service Requester mode. Search services in Tamil Nadu!', 'info');
  }

  renderCategoryChips() {
    const container = document.getElementById('requester-category-chips');
    if (!container) return;

    container.innerHTML = SERVICE_CATEGORIES.map(cat => {
      const isActive = this.currentCategory === cat.id;
      return `
        <button type="button" class="category-chip ${isActive ? 'active' : ''}" onclick="app.filterByCategory('${cat.id}')">
          <i class="fa-solid ${cat.icon}"></i>
          <span>${cat.name}</span>
        </button>
      `;
    }).join('');
  }

  filterByCategory(categoryId) {
    this.currentCategory = categoryId;
    this.renderCategoryChips();
    this.renderRequesterProviders();
  }

  handleRequesterSearch(query) {
    this.searchQuery = query.trim().toLowerCase();
    this.renderRequesterProviders();
  }

  handleRequesterLocation(loc) {
    this.locationFilter = loc;
    this.renderRequesterProviders();
  }

  triggerRequesterSearch() {
    this.renderRequesterProviders();
    const grid = document.getElementById('requester-providers-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleRequesterAvailToday(checked) {
    this.availableTodayOnly = checked;
    this.renderRequesterProviders();
  }

  handleRequesterSort(sortBy) {
    this.sortBy = sortBy;
    this.renderRequesterProviders();
  }

  getFilteredProviders() {
    return this.providers.filter(p => {
      if (this.currentCategory !== 'all' && p.category !== this.currentCategory) {
        return false;
      }

      if (this.locationFilter !== 'all') {
        const queryLoc = this.locationFilter.toLowerCase();
        const provLoc = (p.location + ' ' + (p.city || '') + ' ' + (p.area || '')).toLowerCase();
        if (!provLoc.includes(queryLoc)) {
          return false;
        }
      }

      if (this.availableTodayOnly && !p.availableToday) {
        return false;
      }

      if (this.searchQuery) {
        const matchName = p.name.toLowerCase().includes(this.searchQuery);
        const matchCategory = p.categoryLabel.toLowerCase().includes(this.searchQuery);
        const matchBio = p.bio.toLowerCase().includes(this.searchQuery);
        const matchLoc = p.location.toLowerCase().includes(this.searchQuery);
        const matchServices = p.subServices.some(s => s.name.toLowerCase().includes(this.searchQuery));
        if (!matchName && !matchCategory && !matchBio && !matchLoc && !matchServices) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      switch (this.sortBy) {
        case 'rating-high':
          return b.rating - a.rating;
        case 'price-low':
          return a.hourlyRate - b.hourlyRate;
        case 'price-high':
          return b.hourlyRate - a.hourlyRate;
        case 'recommended':
        default:
          return (b.rating * b.reviewCount) - (a.rating * a.reviewCount);
      }
    });
  }

  renderRequesterProviders() {
    const grid = document.getElementById('requester-providers-grid');
    const counter = document.getElementById('requester-results-count');
    if (!grid) return;

    const filtered = this.getFilteredProviders();
    if (counter) counter.innerText = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-person-circle-question"></i>
          <h3>No Providers Found in this Location</h3>
          <p>Try selecting "All Locations (Tamil Nadu)", or register as a provider in your locality!</p>
          <div style="display:flex; gap:12px; justify-content:center; margin-top:16px;">
            <button type="button" class="btn-primary" onclick="app.locationFilter='all'; document.getElementById('req-location-select').value='all'; app.renderRequesterProviders();">
              <span>View All Tamil Nadu Providers</span>
            </button>
            <button type="button" class="btn-outline" onclick="app.openProviderFlow();">
              <span>Register as Pro in this Area</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const subTags = p.subServices.slice(0, 3).map(s => `<span class="service-tag">${s.name} - ₹${s.price}</span>`).join('');
      return `
        <div class="provider-card">
          <div class="provider-header">
            <div class="provider-avatar-wrapper">
              <img src="${p.avatar}" alt="${p.name}" class="provider-avatar">
              ${p.isVerified ? `<div class="verified-badge" title="ID & Police / Background Verified in TN"><i class="fa-solid fa-check"></i></div>` : ''}
            </div>
            <div class="provider-meta">
              <div class="provider-title-row">
                <h3 class="provider-name">${p.name}</h3>
                <div class="rating-badge">
                  <i class="fa-solid fa-star"></i>
                  <span>${p.rating.toFixed(1)}</span>
                  <span style="font-size:0.75rem; font-weight:normal; color:#92400e;">(${p.reviewCount})</span>
                </div>
              </div>
              <div class="provider-category-badge">${p.categoryLabel}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                <i class="fa-solid fa-location-dot" style="color:var(--primary); font-size:0.75rem;"></i> ${p.location}
              </div>
            </div>
          </div>

          <p class="provider-bio">${p.bio}</p>

          <div class="provider-tags">
            ${subTags}
          </div>

          <div class="provider-status-row">
            <div class="availability-pill ${p.availableToday ? 'available' : 'busy'}">
              <span class="dot"></span>
              <span>${p.availableToday ? 'Available Today in TN' : 'Available Tomorrow'}</span>
            </div>
            <div class="provider-rate">
              ₹${p.hourlyRate}<span>/visit</span>
            </div>
          </div>

          <div class="provider-card-footer">
            <button type="button" class="btn-details" onclick="app.openProviderDetails('${p.id}')">
              <i class="fa-regular fa-id-badge"></i>
              <span>Profile</span>
            </button>
            <button type="button" class="btn-book" onclick="app.openBookingModal('${p.id}')">
              <i class="fa-solid fa-calendar-plus"></i>
              <span>Book This Pro</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================================================
  // OPTION 2: SERVICE PROVIDER FLOW (REGISTRATION & DASHBOARD)
  // ========================================================
  openProviderFlow() {
    this.currentView = 'provider';
    document.getElementById('first-page-view').style.display = 'none';
    document.getElementById('requester-flow-view').style.display = 'none';
    document.getElementById('provider-flow-view').style.display = 'block';

    document.getElementById('btn-back-home').style.display = 'inline-flex';
    
    const modeBadge = document.getElementById('nav-mode-badge');
    modeBadge.className = 'current-role-pill provider';
    modeBadge.style.display = 'inline-flex';
    document.getElementById('nav-mode-text').innerHTML = `<i class="fa-solid fa-briefcase"></i> Pro: ${this.activeProvider ? this.activeProvider.name : 'Setup'}`;

    document.getElementById('btn-track-bookings').style.display = 'none';

    // Always show the provider setup form directly as requested
    this.showProviderSetupForm();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast('Please enter your service trade, location, and visiting charge in ₹ below.', 'info');
  }

  showProviderSetupForm() {
    document.getElementById('provider-setup-card').style.display = 'block';
    document.getElementById('provider-dashboard-view').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showProviderDashboard() {
    document.getElementById('provider-setup-card').style.display = 'none';
    document.getElementById('provider-dashboard-view').style.display = 'block';
    this.renderProviderDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveProviderProfile(e) {
    e.preventDefault();
    const name = document.getElementById('p-name').value.trim();
    const phone = document.getElementById('p-phone').value.trim();
    const category = document.getElementById('p-category').value;
    const experienceYears = parseInt(document.getElementById('p-experience').value, 10) || 5;
    const city = document.getElementById('p-city').value;
    const area = document.getElementById('p-area').value.trim();
    const hourlyRate = parseInt(document.getElementById('p-visiting-charge').value, 10) || 350;
    const availableToday = document.getElementById('p-avail').value === 'true';
    const sub1Name = document.getElementById('p-sub1-name').value.trim();
    const sub1Price = parseInt(document.getElementById('p-sub1-price').value, 10) || 349;
    const sub2Name = document.getElementById('p-sub2-name').value.trim();
    const sub2Price = parseInt(document.getElementById('p-sub2-price').value, 10) || 499;
    const bio = document.getElementById('p-bio').value.trim() || `Verified service professional serving ${area}, ${city} with ${experienceYears} years of reliable experience.`;

    const catObj = SERVICE_CATEGORIES.find(c => c.id === category);
    const categoryLabel = catObj ? catObj.name : category;

    const avatars = [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256'
    ];
    const pickedAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newProvider = {
      id: 'prov-' + Date.now(),
      name,
      phone,
      category,
      categoryLabel,
      avatar: pickedAvatar,
      rating: 5.0,
      reviewCount: 1,
      hourlyRate,
      city,
      area,
      location: `${city} (${area})`,
      isVerified: true,
      availableToday,
      experienceYears,
      completedJobs: 1,
      bio,
      subServices: [
        { name: sub1Name, price: sub1Price, duration: '1 hr' },
        { name: sub2Name, price: sub2Price, duration: '1.5 hrs' }
      ],
      reviews: [
        { author: 'Welcome Verification', rating: 5, date: 'Today', comment: 'Profile verified by LocalPulse Tamil Nadu Partner onboarding team.' }
      ]
    };

    // Prepend to providers list
    this.providers.unshift(newProvider);
    this.activeProvider = newProvider;
    this.saveProviders();

    // Persist provider into SQLite database (marketplace.db)
    fetch('/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProvider)
    }).then(res => res.json()).then(data => {
      console.log('✅ [SQLite DB] Provider saved into marketplace.db:', data);
    }).catch(err => {
      console.warn('Backend provider persist notice:', err.message);
    });

    // Show dashboard
    document.getElementById('provider-setup-card').style.display = 'none';
    document.getElementById('provider-dashboard-view').style.display = 'block';
    
    // Update active badge in navbar
    const modeBadge = document.getElementById('nav-mode-badge');
    modeBadge.className = 'current-role-pill provider';
    document.getElementById('nav-mode-text').innerHTML = `<i class="fa-solid fa-briefcase"></i> Pro: ${newProvider.name}`;

    this.renderProviderDashboard();
    this.showToast(`🎉 Congratulations ${newProvider.name}! Your profile is saved in Tamil Nadu and logged to SQLite DB.`, 'success');
  }

  renderProviderDashboard() {
    if (!this.activeProvider) {
      this.activeProvider = this.providers[0];
    }

    const badge = document.getElementById('dash-active-account-badge');
    if (badge && this.activeProvider) {
      badge.innerHTML = `Your Active Profile: <strong>${this.activeProvider.name} (${this.activeProvider.categoryLabel} • ${this.activeProvider.location} • ₹${this.activeProvider.hourlyRate}/visit)</strong>`;
    }

    const ratingText = document.getElementById('dash-rating-text');
    if (ratingText && this.activeProvider) {
      ratingText.innerText = `${this.activeProvider.rating.toFixed(1)} ★ (${this.activeProvider.reviewCount} reviews)`;
    }

    // Filter bookings for this provider
    const provBookings = this.bookings.filter(b => b.providerId === this.activeProvider.id || b.providerName === this.activeProvider.name);
    const totalBookings = provBookings.length;
    const totalRev = provBookings
      .filter(b => b.status === 'Completed' || b.status === 'In Progress' || b.status === 'Accepted' || b.status === 'On The Way')
      .reduce((acc, b) => acc + (b.totalPrice - 49), 0);
    const activeJobs = provBookings.filter(b => b.status === 'Requested' || b.status === 'Accepted' || b.status === 'On The Way' || b.status === 'In Progress').length;

    document.getElementById('dash-total-bookings').innerText = totalBookings;
    document.getElementById('dash-total-revenue').innerText = `₹${totalRev.toLocaleString('en-IN')}`;
    document.getElementById('dash-active-jobs').innerText = activeJobs;

    const tbody = document.getElementById('provider-table-tbody');
    if (!tbody) return;

    if (provBookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:36px; color:var(--text-muted);">
            <i class="fa-solid fa-inbox" style="font-size:2rem; margin-bottom:8px; display:block; color:var(--text-light);"></i>
            No booking requests yet for ${this.activeProvider.name}.<br>
            Click <strong>"Simulate Customer Request (Test Popup)"</strong> above to test how incoming requests alert you with Accept/Decline!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = provBookings.map(b => {
      const statusClass = b.status.replace(/\s+/g, '-');
      return `
        <tr>
          <td><strong style="font-size:0.85rem; color:var(--primary);">${b.id}</strong></td>
          <td>
            <strong>${b.customerName}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${b.customerPhone}</span>
          </td>
          <td>
            <strong>${b.serviceTitle}</strong>
            ${b.specialInstructions ? `<br><small style="color:var(--text-muted);">"${b.specialInstructions}"</small>` : ''}
          </td>
          <td>
            <span>${b.date}</span><br>
            <span style="font-size:0.8rem; color:var(--text-muted);">${b.timeSlot}</span>
          </td>
          <td style="max-width:180px; font-size:0.85rem; color:var(--text-muted);">
            <i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${b.customerAddress}
          </td>
          <td>
            <strong style="color:var(--dark);">₹${b.totalPrice.toLocaleString('en-IN')}</strong>
          </td>
          <td>
            <span class="status-badge ${statusClass}">${b.status}</span>
          </td>
          <td>
            <div class="stage-btn-group">
              ${b.status === 'Requested' ? `
                <button type="button" class="action-btn-sm success" onclick="app.advanceJobStatus('${b.id}', 'Accepted')" title="Accept this customer job">
                  <i class="fa-solid fa-check"></i> Accept
                </button>
                <button type="button" class="action-btn-sm" style="color:var(--danger); border:1px solid #fee2e2;" onclick="app.advanceJobStatus('${b.id}', 'Declined')" title="Reject request">
                  <i class="fa-solid fa-xmark"></i> Decline
                </button>
              ` : ''}

              ${b.status === 'Accepted' ? `
                <button type="button" class="action-btn-sm primary" onclick="app.advanceJobStatus('${b.id}', 'On The Way')">
                  <i class="fa-solid fa-motorcycle"></i> Set: On The Way
                </button>
              ` : ''}

              ${b.status === 'On The Way' ? `
                <button type="button" class="action-btn-sm primary" onclick="app.advanceJobStatus('${b.id}', 'In Progress')">
                  <i class="fa-solid fa-play"></i> Start Job
                </button>
              ` : ''}

              ${b.status === 'In Progress' ? `
                <button type="button" class="action-btn-sm success" onclick="app.advanceJobStatus('${b.id}', 'Completed')">
                  <i class="fa-solid fa-check-double"></i> Mark Completed
                </button>
              ` : ''}

              ${b.status === 'Completed' ? `
                <span style="font-size:0.8rem; color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Completed</span>
              ` : ''}

              ${b.status === 'Declined' ? `
                <span style="font-size:0.8rem; color:#dc2626;"><i class="fa-solid fa-circle-xmark"></i> Declined</span>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ========================================================
  // INCOMING REQUEST POPUP & ACCEPT / DECLINE DECISION
  // ========================================================
  triggerProviderPopup(booking) {
    this.pendingIncomingBooking = booking;

    document.getElementById('inc-id').innerText = booking.id;
    document.getElementById('inc-service').innerText = booking.serviceTitle;
    document.getElementById('inc-name').innerText = booking.customerName;
    document.getElementById('inc-phone').innerText = booking.customerPhone;
    document.getElementById('inc-address').innerText = booking.customerAddress;
    document.getElementById('inc-slot').innerText = `${booking.date} (${booking.timeSlot})`;
    document.getElementById('inc-price').innerText = `₹${booking.totalPrice.toLocaleString('en-IN')}`;

    const notesWrap = document.getElementById('inc-notes-wrap');
    const notesContent = document.getElementById('inc-notes');
    if (booking.specialInstructions) {
      notesContent.innerText = booking.specialInstructions;
      notesWrap.style.display = 'block';
    } else {
      notesWrap.style.display = 'none';
    }

    this.playChime();
    this.openModal('incoming-popup-modal');
  }

  playChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // Audio might be muted or blocked by browser before click
    }
  }

  providerDecision(isAccepted) {
    if (!this.pendingIncomingBooking) {
      this.closeModal('incoming-popup-modal');
      return;
    }

    const bookingId = this.pendingIncomingBooking.id;
    const booking = this.bookings.find(b => b.id === bookingId);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newStatus = isAccepted ? 'Accepted' : 'Declined';
    const auditNote = isAccepted
      ? `Booking was ACCEPTED by ${booking ? booking.providerName : 'Provider'}. Live tracking initiated.`
      : `Booking was DECLINED by ${booking ? booking.providerName : 'Provider'}.`;

    if (booking) {
      booking.status = newStatus;
      booking.statusHistory.push({
        status: newStatus,
        time: timeStr,
        note: auditNote
      });

      if (isAccepted) {
        this.showToast(`✅ You ACCEPTED booking ${booking.id}! Live tracking started for customer.`, 'success');
      } else {
        this.showToast(`❌ Booking ${booking.id} was declined.`, 'error');
      }

      this.saveBookings();
    }

    // Persist acceptance/rejection with timestamp into SQLite DB
    fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        note: auditNote
      })
    }).then(res => res.json()).then(data => {
      console.log(`✅ [SQLite DB] Status updated for ${bookingId} -> ${newStatus}:`, data);
    }).catch(err => {
      console.warn('Backend status update notice:', err.message);
    });

    this.closeModal('incoming-popup-modal');
    this.pendingIncomingBooking = null;

    if (this.currentView === 'provider') {
      this.renderProviderDashboard();
    }
  }

  advanceJobStatus(bookingId, newStatus) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let note = '';
    if (newStatus === 'Accepted') note = `${booking.providerName} confirmed the booking`;
    else if (newStatus === 'On The Way') note = `${booking.providerName} is on the way to your address`;
    else if (newStatus === 'In Progress') note = 'Technician arrived and began service work';
    else if (newStatus === 'Completed') note = 'Service completed successfully! Invoice generated.';
    else if (newStatus === 'Declined') note = 'Provider declined booking request';

    booking.status = newStatus;
    booking.statusHistory.push({
      status: newStatus,
      time: timeStr,
      note
    });

    this.saveBookings();
    this.renderProviderDashboard();
    this.showToast(`Status updated to: ${newStatus}`, 'success');

    // Persist transition into SQLite DB (marketplace.db)
    fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note })
    }).then(res => res.json()).then(data => {
      console.log(`✅ [SQLite DB] Transitioned ${bookingId} to ${newStatus}:`, data);
    }).catch(err => {
      console.warn('Backend transition notice:', err.message);
    });
  }

  simulateIncomingRequest() {
    const sampleCustomers = [
      { name: 'Kavya Ramesh', phone: '+91 98403 88124', address: 'Flat 4A, Shanthi Colony, Anna Nagar, Chennai' },
      { name: 'Manoj Kumar', phone: '+91 94433 77219', address: '18, 5th Cross, Thillai Nagar, Trichy' },
      { name: 'Revathi Balaji', phone: '+91 97892 44102', address: '42, Race Course Road, Coimbatore' },
      { name: 'Vijay Shankar', phone: '+91 96001 22981', address: '7, Bye Pass Road, Ponmeni, Madurai' }
    ];

    const pickCust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
    const pickService = this.activeProvider && this.activeProvider.subServices.length > 0
      ? this.activeProvider.subServices[Math.floor(Math.random() * this.activeProvider.subServices.length)]
      : { name: 'Emergency Inspection & Repair', price: 349 };

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const simBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      providerId: this.activeProvider ? this.activeProvider.id : 'prov-1',
      providerName: this.activeProvider ? this.activeProvider.name : 'Murugan K.',
      category: this.activeProvider ? this.activeProvider.category : 'plumber',
      serviceTitle: pickService.name,
      date: now.toISOString().split('T')[0],
      timeSlot: '02:00 PM - 04:00 PM',
      customerName: pickCust.name,
      customerPhone: pickCust.phone,
      customerAddress: pickCust.address,
      totalPrice: pickService.price + 49,
      status: 'Requested', // Pops up for provider!
      specialInstructions: 'Urgent service needed, please arrive on time.',
      createdAt: now.toISOString(),
      statusHistory: [
        { status: 'Requested', time: timeStr, note: 'New customer booking request placed' }
      ]
    };

    this.bookings.unshift(simBooking);
    this.saveBookings();
    this.updateMyBookingsBadge();
    this.renderProviderDashboard();

    // Persist simulated request into SQLite database (marketplace.db)
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simBooking)
    }).then(res => res.json()).then(data => {
      console.log('✅ [SQLite DB] Simulated booking saved into marketplace.db:', data);
    }).catch(err => {
      console.warn('Backend simulate booking notice:', err.message);
    });

    // Trigger popup modal immediately
    this.triggerProviderPopup(simBooking);
  }

  // ========================================================
  // CUSTOMER BOOKING SUBMISSION & MODAL
  // ========================================================
  openBookingModal(providerId) {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) return;

    this.selectedProvider = provider;
    document.getElementById('book-provider-id').value = provider.id;
    document.getElementById('book-provider-subtitle').innerText = `Booking appointment with ${provider.name} (${provider.location})`;

    const select = document.getElementById('book-subservice');
    select.innerHTML = provider.subServices.map(sub => `
      <option value="${sub.name}" data-price="${sub.price}">${sub.name} - ₹${sub.price} (${sub.duration})</option>
    `).join('');

    this.updateBookingCalculation();
    this.openModal('customer-book-modal');
  }

  updateBookingCalculation() {
    const select = document.getElementById('book-subservice');
    if (!select || !select.options[select.selectedIndex]) return;

    const price = parseFloat(select.options[select.selectedIndex].getAttribute('data-price') || 350);
    const platformFee = 49;
    const total = price + platformFee;

    document.getElementById('price-subtotal').innerText = `₹${price.toLocaleString('en-IN')}`;
    document.getElementById('price-fee').innerText = `₹${platformFee}`;
    document.getElementById('price-total').innerText = `₹${total.toLocaleString('en-IN')}`;
  }

  handleBookingSubmit(e) {
    e.preventDefault();
    if (!this.selectedProvider) return;

    const select = document.getElementById('book-subservice');
    const serviceName = select.value;
    const basePrice = parseFloat(select.options[select.selectedIndex].getAttribute('data-price') || 350);
    const totalAmount = basePrice + 49;
    const date = document.getElementById('book-date').value;
    const timeSlot = document.getElementById('book-timeslot').value;
    const customerName = document.getElementById('book-name').value;
    const customerPhone = document.getElementById('book-phone').value;
    const customerAddress = document.getElementById('book-address').value;
    const notes = document.getElementById('book-problem').value;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newBooking = {
      id: 'BK-' + Math.floor(1000 + Math.random() * 9000),
      providerId: this.selectedProvider.id,
      providerName: this.selectedProvider.name,
      category: this.selectedProvider.category,
      serviceTitle: serviceName,
      date,
      timeSlot,
      customerName,
      customerPhone,
      customerAddress,
      totalPrice: totalAmount,
      status: 'Requested', // Crucial initial status: awaiting provider acceptance!
      specialInstructions: notes,
      createdAt: now.toISOString(),
      statusHistory: [
        { status: 'Requested', time: timeStr, note: 'Booking request submitted by customer' }
      ]
    };

    this.bookings.unshift(newBooking);
    this.saveBookings();
    this.updateMyBookingsBadge();

    // Persist real customer booking into SQLite database (marketplace.db)
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    }).then(res => res.json()).then(data => {
      console.log('✅ [SQLite DB] Customer booking saved into marketplace.db:', data);
    }).catch(err => {
      console.warn('Backend booking persist notice:', err.message);
    });

    this.closeModal('customer-book-modal');
    document.getElementById('book-form').reset();

    this.showToast(`🎉 Booking request sent to ${this.selectedProvider.name}! Awaiting their confirmation.`, 'success');

    // Trigger popup on provider's side
    this.triggerProviderPopup(newBooking);

    // Open Live Tracking for the customer so they see their live status!
    this.openMyBookingsModal();
  }

  // ========================================================
  // CUSTOMER MY BOOKINGS & LIVE TRACKING STEPPER
  // ========================================================
  updateMyBookingsBadge() {
    const badge = document.getElementById('my-bookings-count');
    if (badge) {
      badge.innerText = this.bookings.length;
    }
  }

  openMyBookingsModal() {
    const body = document.getElementById('my-bookings-body');
    if (!body) return;

    if (this.bookings.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding:40px 10px;">
          <i class="fa-regular fa-calendar-xmark" style="font-size:2.5rem; color:var(--text-light); margin-bottom:12px;"></i>
          <h4 style="color:var(--dark); font-size:1.1rem; margin-bottom:6px;">No Bookings Scheduled Yet</h4>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">Browse verified experts across Tamil Nadu and schedule your first service.</p>
          <button type="button" class="btn-primary" onclick="app.closeModal('my-bookings-modal'); app.openRequesterView();">Find a Service Provider</button>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:20px;">
          ${this.bookings.map(b => {
            const statusClass = b.status.replace(/\s+/g, '-');
            
            // Stepper progress calculation
            let step1Class = 'completed';
            let step2Class = '';
            let step3Class = '';
            let step4Class = '';
            let progressWidth = '0%';

            if (b.status === 'Requested') {
              step1Class = 'active';
              progressWidth = '12%';
            } else if (b.status === 'Accepted') {
              step1Class = 'completed';
              step2Class = 'active';
              progressWidth = '45%';
            } else if (b.status === 'On The Way') {
              step1Class = 'completed';
              step2Class = 'completed';
              step3Class = 'active';
              progressWidth = '75%';
            } else if (b.status === 'In Progress') {
              step1Class = 'completed';
              step2Class = 'completed';
              step3Class = 'active';
              progressWidth = '85%';
            } else if (b.status === 'Completed') {
              step1Class = 'completed';
              step2Class = 'completed';
              step3Class = 'completed';
              step4Class = 'completed';
              progressWidth = '100%';
            } else if (b.status === 'Declined' || b.status === 'Cancelled') {
              step1Class = 'completed';
              progressWidth = '25%';
            }

            return `
              <div style="background:#fff; border:1px solid var(--border-subtle); border-radius:16px; padding:20px; box-shadow:var(--shadow-sm);">
                
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
                  <div>
                    <span style="font-size:0.75rem; font-weight:700; color:var(--text-light);">${b.id}</span>
                    <h4 style="font-size:1.15rem; font-weight:800; color:var(--dark);">${b.serviceTitle}</h4>
                    <span style="font-size:0.85rem; color:var(--text-muted);">Assigned Pro: <strong>${b.providerName}</strong></span>
                  </div>
                  <div class="status-badge ${statusClass}">
                    <i class="fa-solid fa-circle-dot" style="font-size:0.6rem;"></i>
                    <span>${b.status}</span>
                  </div>
                </div>

                ${b.status !== 'Declined' && b.status !== 'Cancelled' ? `
                  <div class="tracking-stepper">
                    <div class="stepper-progress-bar">
                      <div class="stepper-progress-fill" style="width: ${progressWidth};"></div>
                    </div>

                    <div class="tracking-step ${step1Class}">
                      <div class="step-indicator">
                        ${step1Class === 'completed' ? '<i class="fa-solid fa-check"></i>' : '1'}
                      </div>
                      <span class="step-title">Request Sent</span>
                    </div>

                    <div class="tracking-step ${step2Class}">
                      <div class="step-indicator">
                        ${step2Class === 'completed' ? '<i class="fa-solid fa-check"></i>' : '2'}
                      </div>
                      <span class="step-title">Pro Accepted</span>
                    </div>

                    <div class="tracking-step ${step3Class}">
                      <div class="step-indicator">
                        ${step3Class === 'completed' ? '<i class="fa-solid fa-check"></i>' : (b.status === 'On The Way' ? '<i class="fa-solid fa-motorcycle"></i>' : '3')}
                      </div>
                      <span class="step-title">${b.status === 'On The Way' ? 'On The Way' : 'In Progress'}</span>
                    </div>

                    <div class="tracking-step ${step4Class}">
                      <div class="step-indicator">
                        ${step4Class === 'completed' ? '<i class="fa-solid fa-check-double"></i>' : '4'}
                      </div>
                      <span class="step-title">Job Completed</span>
                    </div>
                  </div>
                ` : `
                  <div style="background:#fee2e2; color:#991b1b; padding:12px 16px; border-radius:8px; font-size:0.9rem; margin-bottom:16px;">
                    <i class="fa-solid fa-circle-exclamation"></i> This request was ${b.status.toLowerCase()} by the provider. You can browse and select another pro.
                  </div>
                `}

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:0.85rem; color:var(--text-muted); background:#f8fafc; padding:12px 16px; border-radius:10px; margin-bottom:14px;">
                  <div><i class="fa-regular fa-calendar" style="color:var(--primary);"></i> ${b.date}</div>
                  <div><i class="fa-regular fa-clock" style="color:var(--primary);"></i> ${b.timeSlot}</div>
                  <div><i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${b.customerAddress}</div>
                  <div><i class="fa-solid fa-receipt" style="color:var(--primary);"></i> Total: <strong>₹${b.totalPrice.toLocaleString('en-IN')}</strong></div>
                </div>

                ${b.statusHistory && b.statusHistory.length > 0 ? `
                  <div style="font-size:0.8rem; color:var(--text-muted); border-left:2px solid #cbd5e1; padding-left:12px; margin-left:4px; margin-bottom:14px;">
                    ${b.statusHistory.map(h => `
                      <div style="margin-bottom:4px;">
                        <span style="font-weight:700; color:var(--dark);">${h.time}:</span> ${h.note}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <div style="display:flex; justify-content:flex-end; gap:8px;">
                  ${b.status === 'Requested' ? `
                    <button type="button" class="action-btn-sm" style="color:var(--danger); border:1px solid #fecaca; background:#fef2f2;" onclick="app.advanceJobStatus('${b.id}', 'Cancelled')">
                      Cancel Request
                    </button>
                  ` : ''}
                  <button type="button" class="action-btn-sm primary" onclick="app.showToast('Connecting you with provider support hotline...', 'info')">
                    <i class="fa-solid fa-phone"></i> Contact Pro
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    this.openModal('my-bookings-modal');
  }

  // ========================================================
  // PROVIDER DETAILS MODAL
  // ========================================================
  openProviderDetails(providerId) {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) return;

    const modalBody = document.getElementById('details-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display:flex; gap:20px; align-items:center; margin-bottom:20px;">
        <img src="${provider.avatar}" alt="${provider.name}" style="width:84px; height:84px; border-radius:18px; object-fit:cover; border:2px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h2 style="font-size:1.4rem; font-weight:800; color:var(--dark);">${provider.name}</h2>
            ${provider.isVerified ? `<span style="background:#eff6ff; color:#2563eb; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:999px; border:1px solid #bfdbfe;"><i class="fa-solid fa-certificate"></i> Verified Pro (Tamil Nadu)</span>` : ''}
          </div>
          <p style="color:var(--text-muted); font-size:0.95rem; margin-top:2px;">${provider.categoryLabel} • <i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${provider.location}</p>
          <div style="display:flex; gap:16px; margin-top:8px; font-size:0.88rem;">
            <span><strong style="color:var(--dark);">${provider.experienceYears}</strong> Yrs Exp</span>
            <span><strong style="color:var(--dark);">${provider.completedJobs}+</strong> Completed Jobs</span>
            <span style="color:#b45309; font-weight:700;"><i class="fa-solid fa-star" style="color:#f59e0b;"></i> ${provider.rating.toFixed(2)} (${provider.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div style="background:#f8fafc; border:1px solid var(--border-subtle); border-radius:12px; padding:16px; margin-bottom:24px;">
        <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:6px; color:var(--dark);">About the Professional</h4>
        <p style="font-size:0.92rem; color:var(--text-muted); line-height:1.6;">${provider.bio}</p>
      </div>

      <div style="margin-bottom:24px;">
        <h4 style="font-size:1rem; font-weight:700; margin-bottom:12px; color:var(--dark);">Standard Rate Card & Turnaround Time</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          ${provider.subServices.map(s => `
            <div style="background:#fff; border:1px solid var(--border-subtle); border-radius:8px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-weight:600; font-size:0.88rem;">${s.name}</div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${s.duration}</div>
              </div>
              <div style="font-weight:700; color:var(--primary); font-size:1rem;">₹${s.price.toLocaleString('en-IN')}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="font-size:1rem; font-weight:700; color:var(--dark);">Verified Client Reviews (${provider.reviews.length})</h4>
          <span style="font-size:0.85rem; color:var(--text-muted);">From Customers across Tamil Nadu</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${provider.reviews.map(r => `
            <div style="background:#f8fafc; padding:12px 16px; border-radius:8px; border:1px solid var(--border-subtle);">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <strong style="font-size:0.88rem; color:var(--dark);">${r.author}</strong>
                <span style="font-size:0.78rem; color:var(--text-light);">${r.date}</span>
              </div>
              <div style="color:#f59e0b; font-size:0.8rem; margin-bottom:6px;">
                ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted);">${r.comment}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top:20px; text-align:right;">
        <button type="button" class="btn-primary" onclick="app.closeModal('details-modal'); app.openBookingModal('${provider.id}')">
          <i class="fa-solid fa-calendar-plus"></i>
          <span>Book ${provider.name}</span>
        </button>
      </div>
    `;

    this.openModal('details-modal');
  }

  // ========================================================
  // DATABASE INSPECTOR & AUDIT LOGS MODAL (SQLITE BACKEND)
  // ========================================================
  async openDatabaseModal() {
    this.openModal('database-logs-modal');
    await this.fetchDatabaseLogs();
  }

  async fetchDatabaseLogs(showToastNotification = false) {
    const body = document.getElementById('database-logs-body');
    if (!body) return;

    body.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--primary); margin-bottom:12px; display:block;"></i>
        Reading raw tables from SQLite Database (<code>marketplace.db</code>)...
      </div>
    `;

    try {
      const res = await fetch('/api/db/export');
      if (!res.ok) throw new Error('API returned status ' + res.status);
      const data = await res.json();

      const bookings = data.bookings || [];
      const statusLogs = data.status_logs || [];
      const totalBookings = data.total_bookings || 0;
      const totalProviders = data.total_providers || 0;

      body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px; background:#f8fafc; padding:16px 20px; border-radius:12px; border:1px solid var(--border-subtle);">
          <div>
            <div style="font-weight:700; color:var(--dark); font-size:1rem; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-hard-drive" style="color:#059669;"></i>
              Active SQLite Database: <code style="background:#e2e8f0; padding:2px 8px; border-radius:4px; font-size:0.88rem;">${data.database || 'marketplace.db'}</code>
            </div>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-top:4px;">
              Relational Storage: <strong>SQLite 3</strong> (Tracks when booked, accepted/declined, & when completed)
            </div>
          </div>
          <div style="display:flex; gap:16px;">
            <div style="text-align:right;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Total Bookings</span>
              <div style="font-size:1.25rem; font-weight:800; color:var(--primary);">${totalBookings}</div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Verified Providers</span>
              <div style="font-size:1.25rem; font-weight:800; color:#059669;">${totalProviders}</div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Audit Transitions</span>
              <div style="font-size:1.25rem; font-weight:800; color:#8b5cf6;">${statusLogs.length}</div>
            </div>
          </div>
        </div>

        <!-- Section 1: Bookings Table with Lifecycle Timestamps -->
        <div style="margin-bottom:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="font-size:1.05rem; font-weight:700; color:var(--dark);">
              <i class="fa-solid fa-table-list" style="color:var(--primary); margin-right:6px;"></i>
              Bookings Lifecycle Tracking Table (<code style="color:#2563eb;">bookings</code>)
            </h4>
            <span style="font-size:0.8rem; color:var(--text-muted);">Exact timestamps when booked, accepted/declined, and completed</span>
          </div>

          <div class="table-responsive" style="border:1px solid var(--border-subtle); border-radius:10px; overflow:hidden;">
            <table class="db-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
              <thead>
                <tr style="background:#f1f5f9; text-align:left; border-bottom:2px solid #cbd5e1;">
                  <th style="padding:10px 14px;">Booking ID</th>
                  <th style="padding:10px 14px;">Customer</th>
                  <th style="padding:10px 14px;">Provider & Service</th>
                  <th style="padding:10px 14px;">When Booked (created_at)</th>
                  <th style="padding:10px 14px;">Status</th>
                  <th style="padding:10px 14px;">Accepted / Rejected?</th>
                  <th style="padding:10px 14px;">When Completed?</th>
                  <th style="padding:10px 14px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${bookings.length === 0 ? `
                  <tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No records in bookings table yet.</td></tr>
                ` : bookings.map(b => {
                  const statusClass = (b.status || 'Requested').replace(/\s+/g, '-');
                  return `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="padding:12px 14px;"><strong style="color:var(--primary); font-family:monospace;">${b.id}</strong></td>
                      <td style="padding:12px 14px;">
                        <strong>${b.customer_name}</strong><br>
                        <small style="color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${b.customer_phone}</small>
                      </td>
                      <td style="padding:12px 14px;">
                        <strong>${b.provider_name}</strong><br>
                        <small style="color:var(--text-muted);">${b.service_title}</small>
                      </td>
                      <td style="padding:12px 14px; font-family:monospace; font-size:0.8rem; color:#334155;">
                        <i class="fa-regular fa-clock" style="color:#0284c7;"></i> ${b.created_at || 'N/A'}
                      </td>
                      <td style="padding:12px 14px;">
                        <span class="status-badge ${statusClass}">${b.status}</span>
                      </td>
                      <td style="padding:12px 14px; font-size:0.8rem;">
                        ${b.accepted_at ? `
                          <span style="color:#059669; font-weight:700;"><i class="fa-solid fa-check"></i> Accepted at:</span><br>
                          <span style="font-family:monospace; color:#334155;">${b.accepted_at}</span>
                        ` : (b.declined_at ? `
                          <span style="color:#dc2626; font-weight:700;"><i class="fa-solid fa-xmark"></i> Declined at:</span><br>
                          <span style="font-family:monospace; color:#334155;">${b.declined_at}</span>
                        ` : `
                          <span style="color:#f59e0b; font-weight:600;"><i class="fa-regular fa-hourglass"></i> Pending Decision</span>
                        `)}
                      </td>
                      <td style="padding:12px 14px; font-size:0.8rem;">
                        ${b.completed_at ? `
                          <span style="color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Completed at:</span><br>
                          <span style="font-family:monospace; color:#334155;">${b.completed_at}</span>
                        ` : `
                          <span style="color:var(--text-light);"><i class="fa-solid fa-minus"></i> Not yet</span>
                        `}
                      </td>
                      <td style="padding:12px 14px; font-weight:700; color:var(--dark);">
                        ₹${Number(b.total_price || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 2: Timestamped Status Audit Trail Logs Table -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="font-size:1.05rem; font-weight:700; color:var(--dark);">
              <i class="fa-solid fa-timeline" style="color:#8b5cf6; margin-right:6px;"></i>
              Audit Trail of State Changes (<code style="color:#8b5cf6;">booking_status_logs</code>)
            </h4>
            <span style="font-size:0.8rem; color:var(--text-muted);">Immutable chronological log of each event with timestamps</span>
          </div>

          <div class="table-responsive" style="border:1px solid var(--border-subtle); border-radius:10px; overflow:hidden;">
            <table class="db-table" style="width:100%; border-collapse:collapse; font-size:0.84rem;">
              <thead>
                <tr style="background:#f1f5f9; text-align:left; border-bottom:2px solid #cbd5e1;">
                  <th style="padding:10px 14px;">Log ID</th>
                  <th style="padding:10px 14px;">Booking ID</th>
                  <th style="padding:10px 14px;">State Transition</th>
                  <th style="padding:10px 14px;">Exact Timestamp</th>
                  <th style="padding:10px 14px;">Log Description / Audit Note</th>
                </tr>
              </thead>
              <tbody>
                ${statusLogs.length === 0 ? `
                  <tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No logs recorded yet.</td></tr>
                ` : statusLogs.map(l => {
                  const sClass = (l.status || '').replace(/\s+/g, '-');
                  return `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                      <td style="padding:10px 14px; font-family:monospace; color:var(--text-light);">#${l.id}</td>
                      <td style="padding:10px 14px;"><strong style="font-family:monospace; color:var(--primary);">${l.booking_id}</strong></td>
                      <td style="padding:10px 14px;"><span class="status-badge ${sClass}">${l.status}</span></td>
                      <td style="padding:10px 14px; font-family:monospace; color:#334155;">${l.timestamp}</td>
                      <td style="padding:10px 14px; color:var(--text-main);">${l.note || ''}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      if (showToastNotification) {
        this.showToast('✅ Database logs refreshed from SQLite (marketplace.db)', 'success');
      }
    } catch (err) {
      body.innerHTML = `
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:24px; text-align:center; color:#991b1b;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
          <h4 style="margin-bottom:6px;">Could Not Connect to Database API</h4>
          <p style="font-size:0.9rem; color:#b91c1c; margin-bottom:14px;">Make sure the Python server is running (<code>python server.py</code>).</p>
          <button type="button" class="btn-primary" onclick="app.fetchDatabaseLogs(true)">Retry Connection</button>
        </div>
      `;
    }
  }

  // ========================================================
  // MODALS & TOAST HELPERS
  // ========================================================
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info');
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global modal close on backdrop click & Escape key
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ========================================================
// BULLETPROOF INITIALIZATION & GLOBAL WINDOW EXPOSURE
// ========================================================
window.MarketplaceApp = MarketplaceApp;
var app = null;

function initMarketplaceApp() {
  if (!window.app) {
    try {
      window.app = new MarketplaceApp();
      app = window.app;
      console.log('✅ LocalPulse Marketplace App initialized successfully!');
    } catch (err) {
      console.error('❌ Error initializing MarketplaceApp:', err);
    }
  }
}

// Global window wrapper functions for 100% reliable HTML onclick handlers
window.openRequesterView = function() {
  if (!window.app) initMarketplaceApp();
  if (window.app) window.app.openRequesterView();
};

window.openProviderFlow = function() {
  if (!window.app) initMarketplaceApp();
  if (window.app) window.app.openProviderFlow();
};

window.showFirstPage = function() {
  if (!window.app) initMarketplaceApp();
  if (window.app) window.app.showFirstPage();
};

// Check if DOM is already parsed or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMarketplaceApp);
} else {
  initMarketplaceApp();
}
