export type TemplateId =
  | "starter"
  | "professional"
  | "community-hub"
  | "minimal-modern"
  | "nonprofit-starter"
  | "association-pro";

export type SectionType =
  | "hero"
  | "features"
  | "cta"
  | "testimonials"
  | "stats"
  | "contact-form"
  | "events-list"
  | "directory-grid"
  | "faq"
  | "gallery"
  // Content
  | "rich-text"
  | "image-banner"
  | "video-embed"
  | "custom-html"
  // Layout
  | "cards"
  | "pricing"
  | "team"
  | "logo-cloud"
  | "timeline"
  // Widgets
  | "social-feed"
  | "google-reviews"
  | "google-map"
  | "calendar-widget"
  | "newsletter-signup"
  | "countdown"
  | "social-links"
  // Utility
  | "spacer"
  | "divider";

export type PortalNavStyle = "top-bar" | "sidebar" | "minimal-top";

export interface PageSection {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
}

export interface PageTemplate {
  slug: string;
  title: string;
  sections: PageSection[];
}

export interface LayoutTemplate {
  id: TemplateId;
  name: string;
  description: string;
  previewImage: string;
  portalNavStyle: PortalNavStyle;
  pages: PageTemplate[];
}

export const TEMPLATES: LayoutTemplate[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Simple, clean layout to get up and running quickly",
    previewImage: "/templates/starter-preview.svg",
    portalNavStyle: "top-bar",
    pages: [
      {
        slug: "landing",
        title: "Home",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Welcome to Our Organization",
              subheading: "Join our community and connect with members who share your passion.",
              ctaText: "Become a Member",
              ctaLink: "/portal",
              backgroundImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80",
            },
          },
          {
            id: "features",
            type: "features",
            props: {
              heading: "Why Join Us?",
              items: [
                { icon: "Users", title: "Community", description: "Connect with like-minded individuals in your area." },
                { icon: "Calendar", title: "Events", description: "Access exclusive events, workshops, and networking opportunities." },
                { icon: "BookOpen", title: "Resources", description: "Get access to member-only resources and publications." },
                { icon: "Heart", title: "Support", description: "Be part of a supportive network that helps each other grow." },
              ],
            },
          },
          {
            id: "cta",
            type: "cta",
            props: {
              heading: "Ready to Get Started?",
              description: "Join today and become part of our growing community.",
              ctaText: "Sign Up Now",
              ctaLink: "/register",
            },
          },
        ],
      },
      {
        slug: "about",
        title: "About",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "About Us",
              subheading: "Learn more about our mission, history, and the people behind our organization.",
              size: "small",
            },
          },
          {
            id: "stats",
            type: "stats",
            props: {
              items: [
                { value: "500+", label: "Members" },
                { value: "50+", label: "Events / Year" },
                { value: "25", label: "Years Active" },
                { value: "100%", label: "Community Driven" },
              ],
            },
          },
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Contact Us",
              subheading: "We'd love to hear from you. Reach out with questions or feedback.",
              size: "small",
            },
          },
          {
            id: "contact-form",
            type: "contact-form",
            props: {
              fields: ["name", "email", "message"],
            },
          },
        ],
      },
      {
        slug: "events",
        title: "Events",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Upcoming Events",
              subheading: "Stay connected with what's happening in our community.",
              size: "small",
            },
          },
          {
            id: "events-list",
            type: "events-list",
            props: {
              showPast: false,
              limit: 10,
            },
          },
        ],
      },
      {
        slug: "directory",
        title: "Directory",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Member Directory",
              subheading: "Find and connect with fellow members.",
              size: "small",
            },
          },
          {
            id: "directory-grid",
            type: "directory-grid",
            props: {
              showSearch: true,
              columns: 3,
            },
          },
        ],
      },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Sidebar navigation with detailed sections for professional associations",
    previewImage: "/templates/professional-preview.svg",
    portalNavStyle: "sidebar",
    pages: [
      {
        slug: "landing",
        title: "Home",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Advancing Excellence in Our Industry",
              subheading: "The premier professional association for leaders and practitioners.",
              ctaText: "Join the Association",
              ctaLink: "/portal",
              backgroundImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80",
            },
          },
          {
            id: "stats",
            type: "stats",
            props: {
              items: [
                { value: "2,500+", label: "Members Nationwide" },
                { value: "120+", label: "Annual Events" },
                { value: "40", label: "Years of Leadership" },
                { value: "95%", label: "Renewal Rate" },
              ],
            },
          },
          {
            id: "features",
            type: "features",
            props: {
              heading: "Membership Benefits",
              items: [
                { icon: "Award", title: "Professional Development", description: "Access continuing education and certification programs." },
                { icon: "Briefcase", title: "Career Resources", description: "Job boards, mentorship, and career advancement tools." },
                { icon: "Globe", title: "Industry Advocacy", description: "We represent your interests at local and national levels." },
                { icon: "BookOpen", title: "Publications", description: "Members-only research, whitepapers, and industry reports." },
              ],
            },
          },
          {
            id: "testimonials",
            type: "testimonials",
            props: {
              items: [
                { quote: "Joining this association was the best career decision I've made.", author: "Member since 2019", role: "Senior Director" },
                { quote: "The networking opportunities alone are worth the membership.", author: "Member since 2021", role: "VP of Operations" },
                { quote: "Outstanding professional development and industry insights.", author: "Member since 2018", role: "Practice Lead" },
              ],
            },
          },
          {
            id: "cta",
            type: "cta",
            props: {
              heading: "Elevate Your Career",
              description: "Join a network of professionals committed to excellence.",
              ctaText: "Apply for Membership",
              ctaLink: "/register",
            },
          },
        ],
      },
      {
        slug: "about",
        title: "About",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Our Mission & Vision",
              subheading: "Dedicated to advancing our profession through education, advocacy, and community.",
              size: "small",
            },
          },
          {
            id: "stats",
            type: "stats",
            props: {
              items: [
                { value: "1985", label: "Founded" },
                { value: "50", label: "State Chapters" },
                { value: "500+", label: "Board Volunteers" },
                { value: "30+", label: "Industry Partners" },
              ],
            },
          },
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Get in Touch", subheading: "Our team is here to assist you.", size: "small" },
          },
          {
            id: "contact-form",
            type: "contact-form",
            props: { fields: ["name", "email", "company", "subject", "message"] },
          },
        ],
      },
      {
        slug: "events",
        title: "Events",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Events & Conferences", subheading: "Professional development opportunities throughout the year.", size: "small" },
          },
          {
            id: "events-list",
            type: "events-list",
            props: { showPast: true, limit: 20 },
          },
        ],
      },
      {
        slug: "directory",
        title: "Directory",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Member Directory", subheading: "Connect with professionals in your field.", size: "small" },
          },
          {
            id: "directory-grid",
            type: "directory-grid",
            props: { showSearch: true, columns: 4 },
          },
        ],
      },
    ],
  },
  {
    id: "community-hub",
    name: "Community Hub",
    description: "Events and directory focused layout for active communities",
    previewImage: "/templates/community-hub-preview.svg",
    portalNavStyle: "top-bar",
    pages: [
      {
        slug: "landing",
        title: "Home",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Your Community, Connected",
              subheading: "Stay informed, get involved, and make a difference in our neighborhood.",
              ctaText: "Join Our Community",
              ctaLink: "/portal",
              backgroundImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80",
            },
          },
          {
            id: "events-list",
            type: "events-list",
            props: {
              heading: "What's Happening",
              showPast: false,
              limit: 4,
            },
          },
          {
            id: "features",
            type: "features",
            props: {
              heading: "Get Involved",
              items: [
                { icon: "MapPin", title: "Local Events", description: "Join community gatherings, meetings, and social events." },
                { icon: "Users", title: "Meet Neighbors", description: "Connect with members through our directory." },
                { icon: "Megaphone", title: "Stay Informed", description: "Get updates on community news and announcements." },
                { icon: "HandHeart", title: "Volunteer", description: "Make a difference by volunteering for community projects." },
              ],
            },
          },
          {
            id: "gallery",
            type: "gallery",
            props: {
              heading: "Community Gallery",
              columns: 3,
              images: [],
            },
          },
          {
            id: "cta",
            type: "cta",
            props: {
              heading: "Be Part of Something Great",
              description: "Join your neighbors in building a stronger, more connected community.",
              ctaText: "Get Started",
              ctaLink: "/register",
            },
          },
        ],
      },
      {
        slug: "about",
        title: "About",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "About Our Community", subheading: "Who we are and what we stand for.", size: "small" },
          },
          {
            id: "faq",
            type: "faq",
            props: {
              heading: "Frequently Asked Questions",
              items: [
                { question: "How do I become a member?", answer: "Click the 'Join' button and complete the registration form." },
                { question: "What are the membership dues?", answer: "Visit our Dues page for current rates and payment options." },
                { question: "How can I volunteer?", answer: "Contact us through the form on our Contact page to learn about volunteer opportunities." },
              ],
            },
          },
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Reach Out", subheading: "We're always happy to hear from community members.", size: "small" },
          },
          {
            id: "contact-form",
            type: "contact-form",
            props: { fields: ["name", "email", "message"] },
          },
        ],
      },
      {
        slug: "events",
        title: "Events",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Community Events", subheading: "From socials to town halls — find your next event.", size: "small" },
          },
          {
            id: "events-list",
            type: "events-list",
            props: { showPast: true, limit: 15 },
          },
        ],
      },
      {
        slug: "directory",
        title: "Directory",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Community Directory", subheading: "Find and connect with your neighbors.", size: "small" },
          },
          {
            id: "directory-grid",
            type: "directory-grid",
            props: { showSearch: true, columns: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "minimal-modern",
    name: "Minimal Modern",
    description: "Clean, spacious layout with focus on whitespace and typography",
    previewImage: "/templates/minimal-modern-preview.svg",
    portalNavStyle: "minimal-top",
    pages: [
      {
        slug: "landing",
        title: "Home",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Welcome",
              subheading: "A modern space for our members to connect, grow, and thrive together.",
              ctaText: "Learn More",
              ctaLink: "/about",
              size: "large",
            },
          },
          {
            id: "features",
            type: "features",
            props: {
              heading: "What We Offer",
              items: [
                { icon: "Sparkles", title: "Curated Events", description: "Thoughtfully planned experiences for our members." },
                { icon: "MessageCircle", title: "Community", description: "A welcoming space to share ideas and build connections." },
                { icon: "TrendingUp", title: "Growth", description: "Resources and support for personal and professional development." },
              ],
            },
          },
          {
            id: "cta",
            type: "cta",
            props: {
              heading: "Join Us",
              description: "Become part of our community today.",
              ctaText: "Sign Up",
              ctaLink: "/register",
            },
          },
        ],
      },
      {
        slug: "about",
        title: "About",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Our Story", subheading: "How we started and where we're headed.", size: "small" },
          },
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Say Hello", subheading: "We'd love to connect with you.", size: "small" },
          },
          {
            id: "contact-form",
            type: "contact-form",
            props: { fields: ["name", "email", "message"] },
          },
        ],
      },
      {
        slug: "events",
        title: "Events",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Events", subheading: "What's coming up.", size: "small" },
          },
          {
            id: "events-list",
            type: "events-list",
            props: { showPast: false, limit: 6 },
          },
        ],
      },
      {
        slug: "directory",
        title: "Directory",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Directory", subheading: "Our members.", size: "small" },
          },
          {
            id: "directory-grid",
            type: "directory-grid",
            props: { showSearch: true, columns: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "nonprofit-starter",
    name: "Nonprofit Starter",
    description: "Donation-focused layout for nonprofits, charities, and foundations",
    previewImage: "/templates/nonprofit-starter-preview.svg",
    portalNavStyle: "top-bar",
    pages: [
      {
        slug: "landing",
        title: "Home",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "Making a Difference, Together",
              subheading: "Support our mission and help us create lasting impact in the communities we serve.",
              ctaText: "Donate Now",
              ctaLink: "/portal",
              backgroundImage: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80",
            },
          },
          {
            id: "stats",
            type: "stats",
            props: {
              heading: "Our Impact",
              items: [
                { value: "10,000+", label: "Lives Impacted" },
                { value: "$2M+", label: "Raised" },
                { value: "150+", label: "Volunteers" },
                { value: "25+", label: "Programs" },
              ],
            },
          },
          {
            id: "features",
            type: "features",
            props: {
              heading: "Our Programs",
              items: [
                { icon: "Heart", title: "Community Outreach", description: "Direct support to families and individuals in need." },
                { icon: "GraduationCap", title: "Education", description: "Scholarships, tutoring, and mentorship programs." },
                { icon: "Leaf", title: "Sustainability", description: "Environmental projects that protect our shared future." },
                { icon: "HandHeart", title: "Volunteer Network", description: "Join hundreds of volunteers making a real difference." },
              ],
            },
          },
          {
            id: "testimonials",
            type: "testimonials",
            props: {
              heading: "Voices of Impact",
              items: [
                { quote: "This organization changed my family's life. The support we received was incredible.", author: "Program Beneficiary", role: "Community Member" },
                { quote: "Volunteering here has been the most rewarding experience. The team is passionate and dedicated.", author: "Sarah M.", role: "Volunteer since 2022" },
                { quote: "Transparent, efficient, and genuinely making a difference. Proud to be a donor.", author: "David R.", role: "Monthly Donor" },
              ],
            },
          },
          {
            id: "cta",
            type: "cta",
            props: {
              heading: "Join Our Mission",
              description: "Every contribution makes a difference. Become a supporter today.",
              ctaText: "Get Involved",
              ctaLink: "/register",
            },
          },
        ],
      },
      {
        slug: "about",
        title: "About",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Our Story", subheading: "Founded with a vision to create meaningful, lasting change.", size: "small" },
          },
          {
            id: "stats",
            type: "stats",
            props: {
              items: [
                { value: "2010", label: "Founded" },
                { value: "15+", label: "Partner Orgs" },
                { value: "50+", label: "Active Programs" },
                { value: "98%", label: "Funds to Programs" },
              ],
            },
          },
          {
            id: "gallery",
            type: "gallery",
            props: {
              heading: "Our Work in Action",
              columns: 3,
              images: [],
            },
          },
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Get in Touch", subheading: "Have questions or want to partner? We'd love to hear from you.", size: "small" },
          },
          {
            id: "contact-form",
            type: "contact-form",
            props: { fields: ["name", "email", "subject", "message"] },
          },
        ],
      },
      {
        slug: "events",
        title: "Events",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Upcoming Events", subheading: "Fundraisers, galas, and community gatherings.", size: "small" },
          },
          {
            id: "events-list",
            type: "events-list",
            props: { showPast: true, limit: 12 },
          },
        ],
      },
      {
        slug: "directory",
        title: "Directory",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Our Supporters", subheading: "The people who make our work possible.", size: "small" },
          },
          {
            id: "directory-grid",
            type: "directory-grid",
            props: { showSearch: true, columns: 3 },
          },
        ],
      },
    ],
  },
  {
    id: "association-pro",
    name: "Association Pro",
    description: "Feature-rich layout for professional associations and trade organizations",
    previewImage: "/templates/association-pro-preview.svg",
    portalNavStyle: "sidebar",
    pages: [
      {
        slug: "landing",
        title: "Home",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: {
              heading: "The Leading Association for Your Industry",
              subheading: "Credentialing, advocacy, and professional development for thousands of members nationwide.",
              ctaText: "Become a Member",
              ctaLink: "/portal",
              backgroundImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80",
            },
          },
          {
            id: "stats",
            type: "stats",
            props: {
              items: [
                { value: "5,000+", label: "Credentialed Members" },
                { value: "200+", label: "Annual Programs" },
                { value: "50", label: "State Chapters" },
                { value: "97%", label: "Satisfaction Rate" },
              ],
            },
          },
          {
            id: "features",
            type: "features",
            props: {
              heading: "Why Professionals Choose Us",
              items: [
                { icon: "Award", title: "Certification Programs", description: "Industry-recognized credentials that advance your career." },
                { icon: "BookOpen", title: "Continuing Education", description: "Hundreds of CE courses, webinars, and workshops." },
                { icon: "Scale", title: "Legislative Advocacy", description: "Protecting and advancing your profession at every level of government." },
                { icon: "Briefcase", title: "Career Center", description: "Exclusive job board, resume reviews, and mentorship matching." },
                { icon: "Globe", title: "Annual Conference", description: "The industry's premier gathering with world-class speakers." },
                { icon: "FileText", title: "Research & Publications", description: "Member-only access to industry reports, white papers, and journals." },
              ],
            },
          },
          {
            id: "testimonials",
            type: "testimonials",
            props: {
              heading: "Member Voices",
              items: [
                { quote: "The certification program gave me a competitive edge that I couldn't find anywhere else.", author: "James K.", role: "Certified Professional" },
                { quote: "The advocacy work this association does is unmatched. They truly fight for our profession.", author: "Maria L.", role: "Practice Owner" },
                { quote: "Between the CE courses and the annual conference, the ROI on membership is incredible.", author: "Dr. Robert T.", role: "Member since 2017" },
              ],
            },
          },
          {
            id: "cta",
            type: "cta",
            props: {
              heading: "Invest in Your Profession",
              description: "Join the thousands of professionals who trust us with their career development.",
              ctaText: "Apply for Membership",
              ctaLink: "/register",
            },
          },
        ],
      },
      {
        slug: "about",
        title: "About",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "About the Association", subheading: "Our history, mission, and commitment to the profession.", size: "small" },
          },
          {
            id: "stats",
            type: "stats",
            props: {
              items: [
                { value: "1978", label: "Established" },
                { value: "500+", label: "Board Volunteers" },
                { value: "12", label: "Specialty Sections" },
                { value: "45+", label: "Years of Service" },
              ],
            },
          },
          {
            id: "faq",
            type: "faq",
            props: {
              heading: "Frequently Asked Questions",
              items: [
                { question: "How do I become a member?", answer: "Apply online through our membership portal. Approval typically takes 3-5 business days." },
                { question: "What are the membership dues?", answer: "Annual dues vary by membership category. Visit our Membership page for current rates." },
                { question: "How do I maintain my certification?", answer: "Certified members must complete 40 CE credits per renewal cycle (every 2 years)." },
                { question: "Can my organization get a group membership?", answer: "Yes! We offer group rates for organizations with 10+ eligible professionals." },
              ],
            },
          },
        ],
      },
      {
        slug: "contact",
        title: "Contact",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Contact Us", subheading: "Our team is here to help with membership, certification, and event inquiries.", size: "small" },
          },
          {
            id: "contact-form",
            type: "contact-form",
            props: { fields: ["name", "email", "company", "subject", "message"] },
          },
        ],
      },
      {
        slug: "events",
        title: "Events",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Events & Conferences", subheading: "Conferences, webinars, chapter meetings, and CE workshops.", size: "small" },
          },
          {
            id: "events-list",
            type: "events-list",
            props: { showPast: true, limit: 20 },
          },
        ],
      },
      {
        slug: "directory",
        title: "Directory",
        sections: [
          {
            id: "hero",
            type: "hero",
            props: { heading: "Member Directory", subheading: "Search for credentialed professionals in your area.", size: "small" },
          },
          {
            id: "directory-grid",
            type: "directory-grid",
            props: { showSearch: true, columns: 4 },
          },
        ],
      },
    ],
  },
];

export function getTemplateById(id: string): LayoutTemplate {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}
