import { Container } from './components/Container'
import { PageGuard } from './components/PageGuard'
import { PublicLayout } from './layout'
import { HomePage } from './pages/HomePage'
import { PublicNotFoundPage } from './pages/PublicNotFoundPage'
import { ContactPage } from './pages/ContactPage'
import { BlogsPage } from './pages/BlogsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage' 
import { AboutPage } from './pages/AboutPage'
import { PublicationsPage } from './pages/PublicationsPage'
import { ServicesPage } from './pages/ServicesPage'
import { BlogDetailPage } from './pages/BlogDetailPage'

// Public site ke SAARE routes yahin (admin/routes.jsx ki tarah).
// Naya page: pages/ mein file banao, yahan ek line. Abhi pages placeholder hain, ek ek karke replace honge.
function Soon({ title }) {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-4xl">{title}</h1>
      <p className="mt-2 text-muted">This page will be built in an upcoming step.</p>
    </Container>
  )
}

export const publicRoutes = [
  {
    path: '/:slug',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },

      // Yeh pages toggle se OFF ho sakte hain
      {
        element: <PageGuard page="services" />,
        children: [{ path: 'services', element: <ServicesPage /> }],
      },
      {
        element: <PageGuard page="projects" />,
        children: [
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:id', element: <ProjectDetailPage /> },
        ],
      },
      {
        element: <PageGuard page="publications" />,
        children: [{ path: 'publications', element: <PublicationsPage /> }],
      },
      {
        element: <PageGuard page="blogs" />,
        children: [
          { path: 'blogs', element: <BlogsPage />},
          {  path: 'blogs/:blogSlug', element: <BlogDetailPage /> },
        ],
      },

      { path: '*', element: <PublicNotFoundPage /> },
    ],
  },
]
