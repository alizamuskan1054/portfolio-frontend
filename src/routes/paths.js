// Saare route paths yahin. Components mein hardcoded strings nahi.
export const paths = {
  root: '/',

  // Login (admin aur client dono ka ek hi)
  login: '/login',

  // Admin
  adminLogin: '/admin/login', // purana link: /login par redirect hota hai
  adminSignup: '/admin/signup',
  adminVerifyEmail: '/admin/verify-email',
  adminForgotPassword: '/admin/forgot-password',
  adminResetPassword: '/admin/reset-password',
  admin: '/admin',
  adminClients: '/admin/clients',
  adminClient: (id) => `/admin/clients/${id}`,
  adminTemplates: '/admin/templates',
  adminPortfolios: '/admin/portfolios',
  adminPortfolioNew: '/admin/portfolios/new',
  adminPortfolioEdit: (id) => `/admin/portfolios/${id}/edit`,
  adminNotifications: '/admin/notifications',
  // Portfolios list mein ek portfolio ka row highlight karke dikhana (notification click)
  adminPortfolioFocus: (id, title) =>
    `/admin/portfolios?highlight=${id}${title ? `&q=${encodeURIComponent(title)}` : ''}`,
  adminSettings: '/admin/settings',
  adminProfile: '/admin/profile',

  // Client portal
  portal: '/portal',
  portalPortfolios: '/portal/portfolios',
  portalAcceptInvite: '/portal/accept-invite',
  portalPortfolioNew: '/portal/portfolios/new',
  portalPortfolio: (id) => `/portal/portfolios/${id}`,
  // part: basic | academic | content | contact | visibility
  portalPortfolioPart: (id, part) => `/portal/portfolios/${id}/${part}`,
  portalMessages: '/portal/messages',
  portalNotifications: '/portal/notifications',
  portalAccount: '/portal/account',

  // Public site
  site: (slug) => `/${slug}`,
  siteAbout: (slug) => `/${slug}/about`,
  siteServices: (slug) => `/${slug}/services`,
  siteProjects: (slug) => `/${slug}/projects`,
  siteProject: (slug, id) => `/${slug}/projects/${id}`,
  sitePublications: (slug) => `/${slug}/publications`,
  siteBlogs: (slug) => `/${slug}/blogs`,
  siteBlog: (slug, blogSlug) => `/${slug}/blogs/${blogSlug}`,
  siteContact: (slug) => `/${slug}/contact`,
}

// Public slug yeh words nahi ho sakte (app routes se takrayenge).
// Wizard ke slug check mein bhi use hoga; backend mein bhi block karwana chahiye.
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'login',
  'signup',
  'static',
  'assets',
  'dev',
  'portal',
  'accept-invite',
  'forgot-password',
  'reset-password',
]
