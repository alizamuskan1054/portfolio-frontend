// Fake data: backend ke bagair public site banane aur test karne ke liye.
// Shapes API doc + planning doc se li gayi hain. Jo fields doc mein confirm nahi (photo, intro, metrics,
// education fields...) wo ASSUMPTIONS hain, real backend se compare karke normalize.js mein theek hongi.
//
// Test slugs:
//   dr-ahmad   -> sab kuch ON, poora content
//   sara-khan  -> Blogs/Testimonials OFF, Awards khali (visibility rules test karne ke liye)
//   draft-only -> published nahi (404 aana chahiye)

const LOREM =
  'Our group studies how data-driven methods can make everyday systems more reliable, transparent and fair. ' +
  'The work combines theory, careful experiments and close collaboration with industry partners.'

const html = (...paragraphs) => paragraphs.map((p) => `<p>${p}</p>`).join('')

const drAhmad = {
  portfolio: {
    slug: 'dr-ahmad',
    title: 'Dr. Ahmad Portfolio',
    full_name: 'Dr. Ahmad Raza',
    designation: 'Associate Professor of Computer Science',
    photo: null,
    intro:
      'I build machine learning systems that stay accurate in the real world, with a focus on healthcare and education.',
    biography: html(
      'I am an Associate Professor of Computer Science with more than twelve years of research experience in machine learning, data mining and human-centred AI.',
      'My work has been supported by national research councils and industry partners, and I regularly supervise graduate students working on applied problems.',
      'Outside the lab I mentor early-career researchers and review for leading journals in the field.',
    ),
    cv_url: 'https://example.com/cv.pdf',
    section_visibility: {
      pages: { services: true, projects: true, publications: true, blogs: true },
      home: {
        research_interests: true,
        featured_projects: true,
        latest_publications: true,
        testimonials: true,
        latest_blogs: true,
      },
      about: { education: true, experience: true, expertise: true, awards: true, memberships: true },
      services: { how_i_work: true, contact_cta: true },
    },
    social_links: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/example' },
      { platform: 'github', url: 'https://github.com/example' },
      { platform: 'google_scholar', url: 'https://scholar.google.com/citations?user=example' },
      { platform: 'twitter', url: 'https://x.com/example' },
    ],
    metrics: { publications: 48, citations: 2150, h_index: 21 },
  },
  contact: {
    email: 'ahmad@example.com',
    phone: '+92 300 1234567',
    whatsapp: '+92 321 7654321',
    address: 'Department of Computer Science, FAST University, Lahore',
  },
  page_intros: [
    { page: 'services', title: 'Services', subtitle: 'Research collaboration, consulting and training for teams and institutions.' },
    { page: 'projects', title: 'Projects', subtitle: 'Selected research and applied work.' },
    { page: 'publications', title: 'Publications', subtitle: 'Peer-reviewed papers, books and conference talks.' },
    { page: 'blogs', title: 'Blog', subtitle: 'Notes on research, teaching and academic life.' },
    { page: 'contact', title: 'Get in touch', subtitle: 'Questions, collaborations or speaking invitations are welcome.' },
  ],
  process_steps: [
    { id: 1, title: 'Discovery', description: 'We discuss your goals, data and constraints.', display_order: 0 },
    { id: 2, title: 'Proposal', description: 'A clear scope, timeline and deliverables.', display_order: 1 },
    { id: 3, title: 'Execution', description: 'Regular updates while the work is carried out.', display_order: 2 },
    { id: 4, title: 'Delivery', description: 'Final report, code and a hand-over session.', display_order: 3 },
  ],
}

const drAhmadAcademic = {
  educations: [
    { id: 1, degree: 'PhD in Computer Science', institution: 'Massachusetts Institute of Technology', start_year: 2010, end_year: 2015, description: 'Thesis on robust learning under distribution shift.', display_order: 0 },
    { id: 2, degree: 'MS in Computer Science', institution: 'FAST University', start_year: 2007, end_year: 2009, description: '', display_order: 1 },
    { id: 3, degree: 'BS in Software Engineering', institution: 'LUMS', start_year: 2003, end_year: 2007, description: '', display_order: 2 },
  ],
  experiences: [
    { id: 1, position: 'Associate Professor', organization: 'FAST University', start_year: 2020, end_year: null, is_current: true, description: 'Leading the Applied AI Lab with 12 researchers.', display_order: 0 },
    { id: 2, position: 'Assistant Professor', organization: 'FAST University', start_year: 2016, end_year: 2020, is_current: false, description: 'Taught machine learning and data mining.', display_order: 1 },
    { id: 3, position: 'Research Intern', organization: 'Microsoft Research', start_year: 2013, end_year: 2013, is_current: false, description: '', display_order: 2 },
  ],
  research_interests: [
    { id: 1, title: 'Machine Learning', description: 'Models that stay reliable outside the lab.', icon: 'brain', display_order: 0 },
    { id: 2, title: 'Healthcare AI', description: 'Decision support for clinicians.', icon: 'heart-pulse', display_order: 1 },
    { id: 3, title: 'Data Mining', description: 'Finding structure in large messy data.', icon: 'database', display_order: 2 },
    { id: 4, title: 'Educational Technology', description: 'Adaptive tools for learners.', icon: 'graduation-cap', display_order: 3 },
  ],
  expertise: [
    { id: 1, title: 'Deep Learning', display_order: 0 },
    { id: 2, title: 'Natural Language Processing', display_order: 1 },
    { id: 3, title: 'Statistical Modelling', display_order: 2 },
    { id: 4, title: 'Research Methodology', display_order: 3 },
    { id: 5, title: 'Technical Writing', display_order: 4 },
  ],
  awards: [
    { id: 1, title: 'Best Paper Award', issuer: 'International Conference on Data Mining', year: 2022, description: '', display_order: 0 },
    { id: 2, title: 'Young Researcher Award', issuer: 'Higher Education Commission', year: 2019, description: '', display_order: 1 },
  ],
  memberships: [
    { id: 1, organization: 'IEEE', role: 'Senior Member', year: 2018, display_order: 0 },
    { id: 2, organization: 'ACM', role: 'Member', year: 2012, display_order: 1 },
  ],
}

const drAhmadServices = [
  { id: 1, title: 'Research Collaboration', short_description: 'Joint projects and grant proposals with academic and industry partners.', image: null, icon: 'users', display_order: 0 },
  { id: 2, title: 'ML Consulting', short_description: 'Model design, evaluation and review for production systems.', image: null, icon: 'cpu', display_order: 1 },
  { id: 3, title: 'Workshops & Training', short_description: 'Hands-on sessions for teams new to machine learning.', image: null, icon: 'presentation', display_order: 2 },
  { id: 4, title: 'Thesis Supervision', short_description: 'Guidance for postgraduate students from topic to defence.', image: null, icon: 'book-open', display_order: 3 },
]

const drAhmadProjects = [
  {
    id: 1, title: 'Early Sepsis Prediction', category: 'Healthcare', year: 2024, status: 'Completed', is_featured: true,
    thumbnail: null, short_description: 'A warning system that flags sepsis hours before clinical signs.',
    description: html(LOREM),
    objectives: ['Detect sepsis earlier than current protocols', 'Keep false alarms low enough for ward use'],
    methodology: html('We trained gradient-boosted and sequence models on three hospital datasets and validated them prospectively.'),
    outcomes: ['Alerts 6 hours earlier on average', 'Pilot running in two hospitals'],
    gallery_images: [],
  },
  {
    id: 2, title: 'Adaptive Learning Platform', category: 'Education', year: 2023, status: 'Ongoing', is_featured: false,
    thumbnail: null, short_description: 'Personalised practice that adapts to each student.',
    description: html(LOREM), objectives: ['Improve retention in first-year programming'], methodology: html('A/B tests across four cohorts.'),
    outcomes: ['12% higher pass rate in pilot'], gallery_images: [],
  },
  {
    id: 3, title: 'Urdu Text Classification', category: 'NLP', year: 2022, status: 'Completed', is_featured: false,
    thumbnail: null, short_description: 'Benchmarks and models for low-resource Urdu text.',
    description: html(LOREM), objectives: [], methodology: '', outcomes: [], gallery_images: [],
  },
  {
    id: 4, title: 'Fair Credit Scoring', category: 'Finance', year: 2021, status: 'Completed', is_featured: false,
    thumbnail: null, short_description: 'Auditing credit models for hidden bias.',
    description: html(LOREM), objectives: [], methodology: '', outcomes: [], gallery_images: [],
  },
]

const drAhmadPublications = [
  { id: 1, title: 'Robust Sepsis Prediction Across Hospitals', authors: 'A. Raza, S. Khan, J. Miller', journal: 'Nature Digital Medicine', year: 2024, type: 'Journal', doi: '10.1000/example.1', url: 'https://example.com/paper-1', is_featured: true },
  { id: 2, title: 'Adaptive Practice for Introductory Programming', authors: 'A. Raza, L. Chen', journal: 'ACM Learning at Scale', year: 2023, type: 'Conference', doi: '10.1000/example.2', url: 'https://example.com/paper-2', is_featured: false },
  { id: 3, title: 'Benchmarks for Urdu Text Classification', authors: 'A. Raza, M. Ali', journal: 'Language Resources and Evaluation', year: 2022, type: 'Journal', doi: '10.1000/example.3', url: '', is_featured: false },
  { id: 4, title: 'Practical Machine Learning for Researchers', authors: 'A. Raza', journal: 'Springer', year: 2021, type: 'Book', doi: '', url: 'https://example.com/book', is_featured: false },
  { id: 5, title: 'Auditing Credit Models for Bias', authors: 'A. Raza, N. Farooq', journal: 'FAccT', year: 2021, type: 'Conference', doi: '10.1000/example.5', url: '', is_featured: false },
  { id: 6, title: 'Distribution Shift in Clinical Data', authors: 'A. Raza', journal: 'Pattern Recognition', year: 2019, type: 'Journal', doi: '10.1000/example.6', url: '', is_featured: false },
]

const drAhmadBlogs = [
  {
    id: 1, slug: 'why-models-fail-in-production', title: 'Why Models Fail in Production', category: 'Machine Learning',
    excerpt: 'Accuracy on a test set is only the start. Here is what usually goes wrong next.',
    cover_image: null, author: 'Dr. Ahmad Raza', published_at: '2026-10-02T09:00:00Z', reading_time: 6, is_featured: true,
    content: html(LOREM, 'The most common cause is data that quietly changes after deployment.') + '<h2>Monitor inputs, not just outputs</h2>' + html('Track feature distributions and alert on drift before accuracy drops.') + '<ul><li>Log inputs</li><li>Compare to training data</li><li>Retrain on a schedule</li></ul>',
  },
  { id: 2, slug: 'supervising-your-first-thesis', title: 'Supervising Your First Thesis', category: 'Academic Life', excerpt: 'Lessons from ten years of guiding graduate students.', cover_image: null, author: 'Dr. Ahmad Raza', published_at: '2026-08-14T09:00:00Z', reading_time: 5, is_featured: false, content: html(LOREM) },
  { id: 3, slug: 'reading-papers-faster', title: 'Reading Research Papers Faster', category: 'Academic Life', excerpt: 'A three-pass method that saves hours every week.', cover_image: null, author: 'Dr. Ahmad Raza', published_at: '2026-06-21T09:00:00Z', reading_time: 4, is_featured: false, content: html(LOREM) },
  { id: 4, slug: 'evaluating-fairness', title: 'Evaluating Fairness in Practice', category: 'Machine Learning', excerpt: 'Which metrics to choose and when they disagree.', cover_image: null, author: 'Dr. Ahmad Raza', published_at: '2026-04-05T09:00:00Z', reading_time: 8, is_featured: false, content: html(LOREM) },
]

const drAhmadTestimonials = [
  { id: 1, name: 'Dr. Sana Malik', designation: 'Head of Data Science, HealthFirst', quote: 'Working with Dr. Ahmad changed how our team evaluates models. Rigorous, clear and always practical.', photo: null, display_order: 0 },
  { id: 2, name: 'Usman Tariq', designation: 'PhD Student', quote: 'The best supervisor I could have asked for. Honest feedback and real support.', photo: null, display_order: 1 },
  { id: 3, name: 'Prof. Laura Chen', designation: 'Collaborator, University of Toronto', quote: 'A generous collaborator who raises the quality of every project.', photo: null, display_order: 2 },
]

const saraKhan = {
  portfolio: {
    slug: 'sara-khan',
    title: 'Sara Khan',
    full_name: 'Sara Khan',
    designation: 'Postdoctoral Researcher, Environmental Science',
    photo: null,
    intro: 'Studying how river basins respond to climate change.',
    biography: html(LOREM),
    cv_url: null,
    section_visibility: {
      pages: { blogs: false, services: true, projects: true, publications: true },
      home: { testimonials: false },
    },
    social_links: [{ platform: 'linkedin', url: 'https://linkedin.com/in/example-sara' }],
    metrics: { publications: null, citations: null, h_index: null },
  },
  contact: { email: 'sara@example.com', phone: '', address: '' },
  page_intros: [],
  process_steps: [],
}

// slug -> bundle. status !== 'published' => public API 404 deti hai
export const mockSites = {
  'dr-ahmad': {
    status: 'published',
    ...drAhmad,
    academic: drAhmadAcademic,
    services: drAhmadServices,
    projects: drAhmadProjects,
    publications: drAhmadPublications,
    blogs: drAhmadBlogs,
    testimonials: drAhmadTestimonials,
  },
  'sara-khan': {
    status: 'published',
    ...saraKhan,
    academic: {
      ...drAhmadAcademic,
      awards: [], // toggle ON + content nahi -> site par chhupa rehna chahiye
      memberships: [],
    },
    services: drAhmadServices.slice(0, 2),
    projects: drAhmadProjects.slice(0, 1),
    publications: drAhmadPublications.slice(0, 2),
    blogs: drAhmadBlogs, // blogs page OFF hai, data safe rehta hai
    testimonials: drAhmadTestimonials,
  },
  'draft-only': { status: 'draft' },
}
