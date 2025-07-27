# AI Document Chat Widget

An embeddable AI assistant widget for Shop Twist and Thread, capable of answering questions about custom sewing services, Class of 2026 collection, and order processing.

## Features

- **Floating Chat Widget**: Clean, professional chat button that expands into a conversation panel
- **AI Knowledge Base**: Pre-trained with Shop Twist and Thread business information
- **Real-time Conversations**: Powered by OpenAI GPT-4o for natural, contextual responses
- **Always-On Hosting**: Designed for Railway deployment with 24/7 uptime
- **Embeddable**: Ready for iframe integration into any website

## Quick Deploy to Railway

1. **Create new GitHub repository**
2. **Copy all files from this project** (except dist/, node_modules/, .replit)
3. **Update package.json** scripts section:
   ```json
   {
     "scripts": {
       "dev": "NODE_ENV=development tsx server/index.ts",
       "build": "node build.js",
       "start": "NODE_ENV=production node dist/index.js",
       "check": "tsc",
       "db:push": "drizzle-kit push"
     }
   }
   ```
4. **Commit to GitHub**
5. **Connect repository to Railway**
6. **Set environment variables**:
   - `DATABASE_URL` (Railway PostgreSQL)
   - `OPENAI_API_KEY` (OpenAI API key)
7. **Deploy automatically**

## Environment Variables Required

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for chat completions
- `NODE_ENV`: Set to 'production' for Railway deployment

## Project Structure

```
├── server/                 # Backend Express server
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   ├── knowledge-base.txt # AI training content
│   └── services/          # AI and processing services
├── client/                # Frontend React components (dev only)
├── shared/                # Shared TypeScript types
├── build.js              # Railway-compatible build script
├── railway.json          # Railway deployment configuration
└── package.json          # Dependencies and scripts
```

## Widget Usage

Once deployed, the widget will be available at your Railway URL (e.g., `https://your-app.railway.app`). 

### Embedding on External Sites

Add to any website with an iframe:
```html
<iframe 
  src="https://your-app.railway.app" 
  width="100%" 
  height="600"
  frameborder="0">
</iframe>
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Technology Stack

- **Frontend**: React 18, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o API
- **Deployment**: Railway platform
- **Build**: esbuild for server, standalone HTML for client

## Business Information

The AI assistant is trained with information about:
- Shop Twist and Thread custom sewing services
- Class of 2026 collection details
- Order processing (1-2 week turnaround)
- Custom patchwork designs on hoodies, tank tops, and clothing

Perfect for customer service automation and business inquiries.