# Autonomous HR Agent Co-Pilot

A modern, stylish HR automation web app using Next.js, shadcn/ui, and n8n for resume screening, candidate ranking, and interview scheduling.

---

## Features

- Upload job descriptions and resumes
- AI-powered candidate ranking
- View and select top candidates or interns
- Schedule interviews with date/time picker
- Stylish UI with shadcn/ui and Tailwind CSS
- Seamless integration with n8n workflows

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [n8n](https://n8n.io/) (self-hosted or cloud)
- [Airtable](https://airtable.com/) account (for intern data)
- Google account (for Calendar integration)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd HR-AI
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment

- Create a `.env.local` file if needed for API keys or custom endpoints.
- Ensure your n8n instance is running and accessible at the URLs used in the code (default: `http://localhost:5678`).

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## n8n Workflow Setup

### 1. Resume Processing & Ranking

- **Webhook Node:** Accepts multipart/form-data (job description + resumes)
- **AI/Function Nodes:** Extracts text, ranks candidates
- **Respond to Webhook:** Returns ranked candidates as JSON

### 2. View Interns

- **Webhook Node:** Accepts job description (large text supported)
- **Airtable Node:** Fetches intern records
- **AI/Function Nodes:** Matches/ranks interns by JD
- **Respond to Webhook:** Returns relevant interns as JSON

### 3. Schedule Interviews

- **Webhook Node:** Accepts selected candidates, job description, date, time, and AM/PM
- **Function/Code Node:** Calculates start/end time in IST
- **Google Calendar Node:** Schedules event
- **Email Node:** Sends confirmation to each candidate
- **Respond to Webhook:** Returns success message

---

## Customization

- **Styling:** Uses shadcn/ui and Tailwind CSS for a modern, glassy look. Easily change gradients and colors in `page.js`.
- **Endpoints:** Update n8n webhook URLs in `page.js` if your n8n instance runs elsewhere.
- **Airtable:** Update Airtable node in n8n to match your base/fields.

---

## Troubleshooting

- **CORS:** If you get CORS errors, configure your n8n instance to allow requests from your frontend domain.
- **Large Job Descriptions:** n8n payload size can be increased with `N8N_PAYLOAD_SIZE_MAX=32mb` in your n8n config.
- **Date/Time Issues:** All times are handled in IST (`+05:30`). Ensure your n8n Code node sets the correct timezone.

---

## Credits

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [n8n](https://n8n.io/)
- [Airtable](https://airtable.com/)
- [Google Calendar API](https://developers.google.com/calendar)

---

## License