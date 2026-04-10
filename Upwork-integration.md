# Upwork API Integration

This document outlines a step-by-step plan for integrating the Upwork API into your Nx monorepo. It covers creating a dedicated Nx library for Upwork, configuring environment variables, implementing authentication and requests, and documenting the process for use across your other apps.

---

## 1. Create a New Library for Upwork Integration

1. **Generate a New Nx Library**  
   Use the Nx CLI to generate a library dedicated to Upwork interactions. For example:
   ```bash
   npx nx g @nx/js:lib upwork-api --directory=libs/integrations
   ```
   This will create a library under `libs/integrations` where all Upwork logic is contained.

2. **Organize Your Code**  
   Keep all Upwork–specific logic (authentication, GraphQL queries, REST calls) inside this library. You can then import and reuse these functions across the different apps in your monorepo.

---

## 2. Setup Environment Variables

1. **Environment Variables**  
   In your `.env` file (and `.env.example`), add variables for the Upwork API, for example:
   ```bash
   UPWORK_CLIENT_ID=your_client_id
   UPWORK_CLIENT_SECRET=your_client_secret
   UPWORK_REFRESH_TOKEN=your_refresh_token  # If using OAuth flow
   ```
2. **Reference in Code**  
   Reference these environment variables in the new library with `process.env.UPWORK_CLIENT_ID` and so on.  
   Ensure `.env` is in your `.gitignore` so secrets aren’t committed.

---

## 3. Implement Authentication & Requests

Depending on your selected approach (GraphQL, REST, OAuth 2.0, etc.):

1. **OAuth Flow**  
   - Implement the necessary steps to request and refresh tokens.  
   - If you need to keep tokens in storage, use a secure approach (e.g., database, encrypted secrets manager, or environment variables).

2. **GraphQL Queries**  
   - Use a lightweight GraphQL library or fetch-based solution to perform queries against the Upwork GraphQL endpoint.  
   - Create helper functions for queries like `getJobs()`, `getFreelancerProfile()`, etc., returning typed data structures for easy integration in your apps.

3. **REST APIs**  
   - For endpoints not exposed by GraphQL or older flows, create functions to handle REST calls.  
   - Maintain TypeScript interfaces so the rest of the monorepo benefits from type safety.

---

## 4. Expose Library Functions

1. **Importing in Server/Client**  
   - If you want to call Upwork from within Node-based services (or a background worker), simply import the library.  
   - If you need to call from the browser extension or Next.js dashboard, be mindful of CORS or tokens. You might need a proxy in your backend if any credentials must remain private.

2. **Sync with Shared Types**  
   - If you have types in `libs/shared-types`, cross-reference them so your new library remains type-aligned with the rest of your code.

---

## 5. Finalize, Document, and Test

1. **Documentation**  
   - Update the monorepo’s main documentation (e.g., `README.md` or another doc) detailing the new library name, environment variables, and usage instructions.

2. **Testing**  
   - Write unit tests in the library using Nx’s built-in testing framework.  
   - Optionally add integration or e2e tests that confirm remote API calls work as expected with your Upwork credentials.

3. **Security Measures**  
   - Verify `.env` is never committed to the repository.  
   - Double-check CORS configurations if calling the Upwork API from a client-side environment.

---

**With these steps complete, Upwork’s API can be accessed from anywhere in your Nx monorepo.**
