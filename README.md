# redis-demo

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Redis Caching** - Upstash Redis for performance optimization
- **Rate Limiting** - Redis-based rate limiting to prevent abuse
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## Redis Cache Demo

This project includes a Redis caching demonstration that shows how Upstash Redis can speed up Convex database queries.

### Setup

1. Create an Upstash Redis database at [upstash.com](https://upstash.com)

2. Add the following environment variables to your `.env.local` file in the `apps/web` directory:

```bash
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### Running the Demo

1. **Home Page**: Visit [http://localhost:3001](http://localhost:3001) to use the todo app

2. **Redis Demo**: Visit [http://localhost:3001/redis-demo](http://localhost:3001/redis-demo) in your browser

3. Click "Fetch Todos" to see the first request (hits Convex database)

4. Click "Fetch Todos" again immediately - notice the faster response time (hits Redis cache)

5. Wait 60 seconds and click again - cache will have expired, so it hits Convex again

### How It Works

- **First request**: Data is fetched from Convex → stored in Redis with 60-second TTL
- **Cached requests**: Data served from Redis (much faster!)
- **Cache expiration**: After 60 seconds, the next request will fetch from Convex again

The demo displays response times and indicates whether data came from Redis cache or Convex database, allowing you to see the performance difference.

## Rate Limiting

This app implements Redis-based rate limiting to prevent abuse and protect free usage limits. Each operation type has its own independent rate limit:

- **Fetch Todos**: 5 requests per minute (from Redis demo page)
- **Add Todo**: 5 additions per minute (from home page)
- **Todo Actions**: 5 toggle/delete actions per minute (from home page)

Rate limits are enforced per IP address using sliding window algorithm with separate Redis keys for each operation type. When limits are exceeded, users see clear error messages with retry times.







## Project Structure

```
redis-demo/
├── apps/
│   ├── web/         # Frontend application (Next.js)
├── packages/
│   ├── backend/     # Convex backend functions and schema
│   │   ├── convex/    # Convex functions and schema
│   │   └── .env.local # Convex environment variables
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
