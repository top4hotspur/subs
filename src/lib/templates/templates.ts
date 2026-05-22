import { WebsiteTemplate } from "@/lib/sites/types";

export const websiteTemplates: Record<WebsiteTemplate["slug"], WebsiteTemplate> = {
  taxi: {
    slug: "taxi",
    name: "Taxi & Private Hire Websites",
    category: "Taxi Website",
    marketingSummary:
      "Managed taxi and private hire websites built to drive direct bookings and trusted local visibility.",
    featureBullets: [
      "Booking-first homepage structure",
      "Clear service area and transfer messaging",
      "Rapid updates for fares and contact details",
    ],
    pricing: {
      setupFeeLabel: "From GBP 399 one-off setup",
      monthlyFeeLabel: "From GBP 79/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: { email: "demo.taxi@myexperiment.club", password: "demo123" },
    defaultConfig: {
      businessName: "CityRide Private Hire",
      primaryColor: "#0ea5e9",
      accentColor: "#0369a1",
      heroHeadline: "24/7 Taxi & Private Hire Service You Can Trust",
      heroSubheading:
        "Fast pickups, fixed-fare journeys, and professional drivers across your local area.",
      ctaLabel: "Book Your Ride",
      services: [
        { id: "local-private-hire", name: "Local taxi/private hire" },
        { id: "airport-transfers", name: "Airport transfers" },
        { id: "corporate-tour-operator", name: "Corporate & tour operator bookings" },
        { id: "golf-transfers", name: "Golf transfers" },
        { id: "tourist-tours", name: "Tourist tours" },
        { id: "event-transport", name: "Event transport" },
      ],
      openingHours: { summary: "Open 24 hours" },
      contact: {
        phone: "020 7946 1000",
        email: "bookings@cityride.example",
        address: "15 Market Street, Central District",
      },
    },
  },
  barbers: {
    slug: "barbers",
    name: "Barber Websites",
    category: "Barbers Website",
    marketingSummary:
      "Managed barber websites designed to showcase services, prices, and recurring client bookings.",
    featureBullets: [
      "Clear service and pricing sections",
      "Promotion-ready homepage layout",
      "Quick contact and walk-in messaging",
    ],
    pricing: {
      setupFeeLabel: "From GBP 349 one-off setup",
      monthlyFeeLabel: "From GBP 69/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: { email: "demo.barbers@myexperiment.club", password: "demo123" },
    defaultConfig: {
      businessName: "Northside Barber Co.",
      primaryColor: "#f97316",
      accentColor: "#c2410c",
      heroHeadline: "Sharp Cuts, Clean Fades, Reliable Service",
      heroSubheading:
        "Convert new visitors into regular clients with a polished barber website.",
      ctaLabel: "Book Your Cut",
      services: [
        {
          id: "gents-haircut",
          name: "Gents Haircut",
          description: "Haircuts category",
          priceLabel: "From £22",
        },
        {
          id: "student-cut",
          name: "Student Cut",
          description: "Haircuts category",
          priceLabel: "From £18",
        },
        {
          id: "childrens-cut",
          name: "Children’s Cut",
          description: "Haircuts category",
          priceLabel: "From £16",
        },
        {
          id: "clipper-cut",
          name: "Clipper Cut",
          description: "Haircuts category",
          priceLabel: "From £15",
        },
        {
          id: "hot-towel-shave",
          name: "Hot Towel Shave",
          description: "Shaves category",
          priceLabel: "From £24",
        },
        {
          id: "head-wet-shave",
          name: "Head Wet Shave",
          description: "Shaves category",
          priceLabel: "From £20",
        },
        {
          id: "beard-trim-shape",
          name: "Beard Trim Shape",
          description: "Beard & Grooming category",
          priceLabel: "From £14",
        },
        {
          id: "haircut-beard-trim",
          name: "Haircut & Beard Trim",
          description: "Beard & Grooming category",
          priceLabel: "From £30",
        },
        {
          id: "facial-mask-hot-towel",
          name: "Facial Mask & Hot Towel",
          description: "Specials category",
          priceLabel: "From £26",
        },
        {
          id: "deluxe-package",
          name: "Deluxe Package",
          description: "Specials category",
          priceLabel: "From £42",
        },
      ],
      openingHours: { summary: "Mon-Sat: 9:00-19:00, Sun: 10:00-16:00" },
      contact: {
        phone: "020 7946 2000",
        email: "bookings@northsidebarber.example",
        address: "8 Kings Avenue, Riverside",
      },
    },
  },
  hairdressers: {
    slug: "hairdressers",
    name: "Hairdresser Websites",
    category: "Hairdressers Website",
    marketingSummary:
      "Managed hairdresser websites built to promote stylists, services, and repeat salon appointments.",
    featureBullets: [
      "Service categories and style menus",
      "Stylist/team presentation blocks",
      "Seasonal offer and campaign-ready content",
    ],
    pricing: {
      setupFeeLabel: "From GBP 359 one-off setup",
      monthlyFeeLabel: "From GBP 72/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.hairdressers@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "Luna Hair Studio",
      primaryColor: "#ec4899",
      accentColor: "#9d174d",
      heroHeadline: "Colour, Cuts, and Styling Your Clients Will Love",
      heroSubheading:
        "Showcase your services and encourage first-time visitors to book with confidence.",
      ctaLabel: "Book a Consultation",
      services: [
        { id: "cut", name: "Wash, cut and blow dry" },
        { id: "color", name: "Full colour and highlights" },
        { id: "balayage", name: "Balayage and toning" },
        { id: "event", name: "Bridal and event styling" },
      ],
      openingHours: { summary: "Tue-Sat: 9:30-18:30, Sun-Mon: Closed" },
      contact: {
        phone: "020 7946 4000",
        email: "hello@lunahair.example",
        address: "4 Victoria Parade, Westfield",
      },
    },
  },
  beauticians: {
    slug: "beauticians",
    name: "Beautician Websites",
    category: "Beauticians Website",
    marketingSummary:
      "Managed beautician websites that highlight treatments, trust signals, and consultation bookings.",
    featureBullets: [
      "Treatment-led service menus",
      "Testimonial and results sections",
      "Consultation-focused call-to-actions",
    ],
    pricing: {
      setupFeeLabel: "From GBP 349 one-off setup",
      monthlyFeeLabel: "From GBP 69/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.beauticians@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "Glow Beauty Rooms",
      primaryColor: "#a855f7",
      accentColor: "#7e22ce",
      heroHeadline: "Beauty Treatments Tailored to Every Client",
      heroSubheading:
        "Present your specialist treatments and grow high-value repeat bookings.",
      ctaLabel: "Book a Treatment",
      services: [
        { id: "facial-treatment", name: "Facial treatment" },
        { id: "brow-shaping", name: "Brow shaping" },
        { id: "lash-lift", name: "Lash lift" },
        { id: "waxing", name: "Waxing" },
      ],
      openingHours: { summary: "Mon-Sat: 10:00-19:00" },
      contact: {
        phone: "020 7946 5000",
        email: "bookings@glowbeauty.example",
        address: "11 Rose Court, Central Quarter",
      },
    },
  },
  "nail-salon": {
    slug: "nail-salon",
    name: "Nail Salon Websites",
    category: "Nail Salon Website",
    marketingSummary:
      "Managed nail salon websites designed to showcase treatments, pricing, and seasonal style collections.",
    featureBullets: [
      "Treatment and package menu sections",
      "Visual style and gallery-ready layout",
      "Fast updates for promotions and bookings",
    ],
    pricing: {
      setupFeeLabel: "From GBP 339 one-off setup",
      monthlyFeeLabel: "From GBP 68/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.nailsalon@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "Blush Nail Lounge",
      primaryColor: "#fb7185",
      accentColor: "#be123c",
      heroHeadline: "Nail Care, BIAB and Nail Art That Stands Out",
      heroSubheading:
        "Promote your signature styles, treatment options, and client booking journey.",
      ctaLabel: "Book Nail Appointment",
      services: [
        { id: "manicure", name: "Luxury manicures" },
        { id: "biab", name: "BIAB overlays" },
        { id: "gel", name: "Gel polish treatments" },
        { id: "art", name: "Custom nail art" },
      ],
      openingHours: { summary: "Mon-Sat: 9:30-19:00" },
      contact: {
        phone: "020 7946 5100",
        email: "hello@blushnails.example",
        address: "19 High Street, Brookside",
      },
    },
  },
  massage: {
    slug: "massage",
    name: "Massage Therapist Websites",
    category: "Massage Website",
    marketingSummary:
      "Managed massage therapist websites focused on treatment clarity, trust, and session bookings.",
    featureBullets: [
      "Treatment-focused service content",
      "Wellness package and pricing visibility",
      "Simple booking and enquiry CTAs",
    ],
    pricing: {
      setupFeeLabel: "From GBP 339 one-off setup",
      monthlyFeeLabel: "From GBP 67/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.massage@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "CalmTouch Therapy",
      primaryColor: "#14b8a6",
      accentColor: "#0f766e",
      heroHeadline: "Massage Therapy for Recovery and Relaxation",
      heroSubheading:
        "Help new clients discover your treatments and book sessions quickly.",
      ctaLabel: "Book a Session",
      services: [
        { id: "massage-30", name: "30-minute massage" },
        { id: "massage-60", name: "60-minute massage" },
        { id: "deep-tissue", name: "Deep tissue massage" },
        { id: "relaxation", name: "Relaxation massage" },
      ],
      openingHours: { summary: "Mon-Fri: 9:00-20:00, Sat: 10:00-16:00" },
      contact: {
        phone: "020 7946 6000",
        email: "appointments@calmtouch.example",
        address: "27 Green Walk, Meadow Park",
      },
    },
  },
  "window-cleaning": {
    slug: "window-cleaning",
    name: "Window Cleaning Websites",
    category: "Window Cleaning Website",
    marketingSummary:
      "Managed window cleaning websites that build trust and support regular residential/commercial bookings.",
    featureBullets: [
      "Coverage zones and plan clarity",
      "Residential and commercial service blocks",
      "Quote request-first conversion sections",
    ],
    pricing: {
      setupFeeLabel: "From GBP 329 one-off setup",
      monthlyFeeLabel: "From GBP 65/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.windowcleaning@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "ClearView Window Cleaning",
      primaryColor: "#0284c7",
      accentColor: "#0f766e",
      heroHeadline: "Sparkling Windows for Homes and Businesses",
      heroSubheading:
        "Promote your service coverage, reliability, and repeat-clean options.",
      ctaLabel: "Request a Quote",
      services: [
        { id: "standard-window", name: "Standard window clean" },
        { id: "conservatory", name: "Conservatory clean" },
        { id: "gutter-fascia", name: "Gutter/fascia clean" },
        { id: "regular-round", name: "Regular round" },
      ],
      openingHours: { summary: "Mon-Fri: 8:00-18:00, Sat: 8:00-14:00" },
      contact: {
        phone: "020 7946 3000",
        email: "hello@clearview.example",
        address: "22 Station Lane, Brookfield",
      },
    },
  },
  "dog-grooming": {
    slug: "dog-grooming",
    name: "Dog Grooming Websites",
    category: "Dog Grooming Website",
    marketingSummary:
      "Managed dog grooming websites that showcase grooming packages and drive appointment enquiries.",
    featureBullets: [
      "Package-led service sections",
      "Trust-building care messaging",
      "Simple booking and contact pathways",
    ],
    pricing: {
      setupFeeLabel: "From GBP 329 one-off setup",
      monthlyFeeLabel: "From GBP 66/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.doggrooming@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "Happy Paws Grooming Studio",
      primaryColor: "#f59e0b",
      accentColor: "#b45309",
      heroHeadline: "Professional Dog Grooming for Happy, Healthy Pets",
      heroSubheading:
        "Show dog owners your grooming packages, care approach, and easy booking options.",
      ctaLabel: "Book Grooming Session",
      services: [
        { id: "small-groom", name: "Small dog groom" },
        { id: "large-groom", name: "Large dog groom" },
        { id: "bath-brush", name: "Bath and brush" },
        { id: "nail-trim", name: "Nail trim" },
      ],
      openingHours: { summary: "Tue-Sat: 9:00-18:00" },
      contact: {
        phone: "020 7946 7000",
        email: "bookings@happypaws.example",
        address: "31 Willow Road, North Park",
      },
    },
  },
  "driving-instructors": {
    slug: "driving-instructors",
    name: "Driving Instructor Websites",
    category: "Driving Instructors Website",
    marketingSummary:
      "Managed driving instructor websites that explain lesson plans and convert enquiries into students.",
    featureBullets: [
      "Lesson package and pricing blocks",
      "Area coverage and availability messaging",
      "Learner trust and pass-rate style content",
    ],
    pricing: {
      setupFeeLabel: "From GBP 349 one-off setup",
      monthlyFeeLabel: "From GBP 69/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.drivinginstructors@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "FirstPass Driving School",
      primaryColor: "#2563eb",
      accentColor: "#1d4ed8",
      heroHeadline: "Driving Lessons Built for First-Time Pass Success",
      heroSubheading:
        "Attract learners with clear lesson options, pricing, and instructor credibility.",
      ctaLabel: "Book Intro Lesson",
      services: [
        { id: "manual", name: "Manual driving lessons" },
        { id: "intensive", name: "Intensive lesson courses" },
        { id: "mock", name: "Mock test sessions" },
        { id: "refresher", name: "Refresher driving lessons" },
      ],
      openingHours: { summary: "Mon-Sun: 8:00-20:00" },
      contact: {
        phone: "020 7946 8000",
        email: "hello@firstpass.example",
        address: "12 College Road, Eastfield",
      },
    },
  },
  "mobile-valeting": {
    slug: "mobile-valeting",
    name: "Mobile Valeting Websites",
    category: "Mobile Valeting Website",
    marketingSummary:
      "Managed mobile valeting websites that highlight convenience, package options, and local coverage.",
    featureBullets: [
      "Vehicle package comparison sections",
      "Coverage area and mobile-callout layout",
      "Easy quote/booking CTAs",
    ],
    pricing: {
      setupFeeLabel: "From GBP 339 one-off setup",
      monthlyFeeLabel: "From GBP 67/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.mobilevaleting@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "ShineOn Mobile Valeting",
      primaryColor: "#0ea5e9",
      accentColor: "#075985",
      heroHeadline: "Professional Mobile Valeting at Your Home or Workplace",
      heroSubheading:
        "Promote your package options, local availability, and high-quality detailing.",
      ctaLabel: "Get Valeting Quote",
      services: [
        { id: "mini-valet", name: "Mini valet" },
        { id: "full-valet", name: "Full valet" },
        { id: "interior-clean", name: "Interior clean" },
        { id: "exterior-wash", name: "Exterior wash" },
      ],
      openingHours: { summary: "Mon-Sat: 8:00-18:00" },
      contact: {
        phone: "020 7946 9000",
        email: "bookings@shineon.example",
        address: "Mobile service across West and Central districts",
      },
    },
  },
  cleaners: {
    slug: "cleaners",
    name: "Cleaning Business Websites",
    category: "Cleaners Website",
    marketingSummary:
      "Managed cleaning business websites for domestic and commercial cleaning companies.",
    featureBullets: [
      "Service type and package clarity",
      "Recurring and one-off cleaning messaging",
      "Fast enquiry and quote flow",
    ],
    pricing: {
      setupFeeLabel: "From GBP 329 one-off setup",
      monthlyFeeLabel: "From GBP 65/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.cleaners@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "BrightHome Cleaning Co.",
      primaryColor: "#06b6d4",
      accentColor: "#0e7490",
      heroHeadline: "Reliable Cleaning Services for Homes and Workplaces",
      heroSubheading:
        "Showcase your cleaning packages and win consistent local contracts.",
      ctaLabel: "Request Cleaning Quote",
      services: [
        { id: "regular-clean", name: "Regular clean" },
        { id: "deep-clean", name: "Deep clean" },
        { id: "end-tenancy", name: "End-of-tenancy clean" },
        { id: "one-off-clean", name: "One-off clean" },
      ],
      openingHours: { summary: "Mon-Sat: 7:30-18:30" },
      contact: {
        phone: "020 7946 9100",
        email: "hello@brighthome.example",
        address: "44 Grove Street, Southfield",
      },
    },
  },
  gardeners: {
    slug: "gardeners",
    name: "Gardener & Landscaping Websites",
    category: "Gardeners Website",
    marketingSummary:
      "Managed gardener and landscaping websites built to attract regular maintenance and project enquiries.",
    featureBullets: [
      "Seasonal service and project showcase",
      "Maintenance plan and landscaping messaging",
      "Quick quote and consultation CTAs",
    ],
    pricing: {
      setupFeeLabel: "From GBP 339 one-off setup",
      monthlyFeeLabel: "From GBP 67/month managed",
      notes: "Pricing varies by pages, integrations, and support level.",
    },
    demoLogin: {
      email: "demo.gardeners@myexperiment.club",
      password: "demo123",
    },
    defaultConfig: {
      businessName: "GreenLine Gardens & Landscaping",
      primaryColor: "#22c55e",
      accentColor: "#166534",
      heroHeadline: "Garden Maintenance and Landscaping That Transforms Outdoor Space",
      heroSubheading:
        "Position your business for ongoing garden care clients and larger landscaping projects.",
      ctaLabel: "Book Garden Visit",
      services: [
        { id: "lawn-cutting", name: "Lawn cutting" },
        { id: "hedge-trimming", name: "Hedge trimming" },
        { id: "garden-tidy", name: "Garden tidy" },
        { id: "regular-maintenance", name: "Regular maintenance" },
      ],
      openingHours: { summary: "Mon-Fri: 8:00-17:30, Sat: 8:00-13:00" },
      contact: {
        phone: "020 7946 9200",
        email: "projects@greenline.example",
        address: "9 Orchard Way, Hillview",
      },
    },
  },
};
