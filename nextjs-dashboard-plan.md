# Plan for creating the dashboard application

We are going to create a new application over NX monorepo. The application will be built using Next.js and TypeScript. It will be a dashboard application that will be used to manage the Chrome extension.

## Tech stack

- Next.js
- Docker
- TypeScript
- Tailwind CSS
- K8s

Aplication will consume data from fast api application (@docker-compose.yml#L24) that will be built in the same monorepo.

The application will work over docker and k8s or standalone (keep in mind that API is dockerized and k8s).

The application will have the following features:

- CRUD operations for JobApplicationBase (@schemas.py#L78 )
- CRUD operations for JobBase (@schemas@schemas.py#L60 ) and start/stop scraper functionality as we have in the extension app @ScraperSection.tsx#L18-64. 

### JobApplicationBase:
This is the part of the application that will be used to display and manage (CRUD) data of Jobs Apply Tracker. List of items should be displayed as a list of cards. 
Use DRY principle for the card component, isolate and reuse the same functionalities and layout as we have in the extension app @JobsApplyTracker.tsx#L33.

Use NX way to share components between apps.

Implement pagination for the list of items. 
Implement Search functionality by title, company and url.
Implement Filter functionality by status, isFavorite and isIrrelevant.

### JobBase:
This is the part of the application that will be used to display and manage (CRUD) of scrapered jobs data (jobs that are scraped from the web @ScraperSection.tsx#L18 ). List of items should be displayed as a list of cards. 
Use DRY principle for the card component, isolate and reuse the same functionalities and layout as we have in the extension app @ScraperSection.tsx#L98-136 .


Use NX way to share components between apps.

Implement pagination for the list of items. 
Implement Search functionality by title and url.
Implement Filter functionality by isFavorite and isIrrelevant.
Implement start/stop scraper functionality as we have in the extension app @ScraperSection.tsx#L18-64. 

Make Dockerfile and K8s deployment files for the dashboard application. Add it to the @docker-compose.yml#L24


