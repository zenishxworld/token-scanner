# TokenShield AI

TokenShield AI is a single-feature platform focused on pump-and-dump token risk scanning.

## Scope

This refactor keeps only the Token Scanner module and removes Smart Contract Auditor, Wallet Inspector, Supabase auth, and Supabase database logic.

## Tech Stack

- React + TypeScript + Vite
- shadcn/ui + Tailwind CSS
- MongoDB + Mongoose (via API route)

## Environment Variables

Create a `.env` file with:

```env
MONGODB_URI=your_mongodb_connection_string
```

## Project Structure

```text
api/
  scans.js
backend/
  config/
    db.js
  models/
    ScanResult.js
  services/
    scanResultService.js
  controllers/
    scanController.js
src/
  components/
    Layout.tsx
    Navbar.tsx
    Footer.tsx
    ui/
  pages/
    Scanner.tsx
    NotFound.tsx
```

## Scanner Flow

1. Enter token address
2. Run scanner analysis
3. POST result to `/api/scans`
4. Save scan result in MongoDB (`ScanResult.create`)
5. Display risk dashboard in the scanner UI

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Notes

- Token analysis logic remains unchanged.
- Only persistence/auth/infrastructure was migrated from Supabase to MongoDB.
