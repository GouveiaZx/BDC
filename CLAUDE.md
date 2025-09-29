# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BDC Classificados is a 100% functional classified ads platform built with Next.js 14, Supabase, and Asaas payment integration. It's a comprehensive marketplace system for Balsas, MA with user management, ad management, subscription plans, and administrative features.

## Development Commands

### Core Commands
```bash
# Development
npm run dev                    # Start development server at http://localhost:3000

# Build & Production
npm run build                  # Build for production
npm start                      # Start production server
npm run analyze                # Analyze bundle with ANALYZE=true

# Code Quality
npm run lint                   # ESLint checking
npm run format                 # Format code with Prettier

# Payment Integration
npm run configure-asaas        # Configure Asaas payment gateway
npm run test-asaas            # Test Asaas integration
```

### Project-Specific Scripts
The project includes custom scripts in the `/scripts` directory for setup and testing:
- `node scripts/setup-env-correto.js` - Environment setup
- `node scripts/verificar-projeto-final.js` - Project status verification
- `node scripts/test-profile-api.js` - API testing
- `node scripts/setup-storage.js` - Storage configuration

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Middleware authentication
- **Database**: Supabase (PostgreSQL), Row Level Security (RLS)
- **Authentication**: JWT + httpOnly Cookies, Supabase Auth
- **Payment**: Asaas integration (PIX, Boleto, Credit Card)
- **Storage**: Supabase Storage for images
- **Email**: Resend for transactional emails

### Project Structure
```
app/
├── api/                       # 45+ API endpoints
│   ├── admin/                 # Administrative operations
│   ├── auth/                  # Authentication (login, register, logout)
│   ├── ads/                   # Advertisement management
│   ├── users/                 # User profile management
│   └── upload/                # File upload handling
├── admin/                     # Administrative dashboard pages
├── components/                # React components
├── lib/                       # Utilities (authUtils, supabase, asaas)
├── styles/                    # Global CSS and Tailwind
└── [main]/                    # Main app pages (ads, profile, etc.)

database/
├── schema.sql                 # Complete PostgreSQL schema
├── seed.sql                   # Initial data
└── create_rpc_*.sql          # Stored procedures

scripts/                       # Setup and testing scripts
middleware.ts                  # Authentication middleware
```

### Database Architecture

The system uses a comprehensive PostgreSQL schema with the following main entities:
- **users**: User accounts with profile data, social login support
- **ads**: Classified advertisements with moderation system
- **categories**: Organized categorization (69 active categories)
- **cities**: Location management (50 cities in Maranhão)
- **subscriptions**: User subscription plans and payment tracking
- **plans**: Subscription tiers (Free to Enterprise)
- **highlights**: Story-like feature for promoted content
- **reports**: Content moderation and user reports system
- **notifications**: In-app notification system
- **coupons**: Discount system with usage tracking

### Authentication & Security

- **Middleware**: Route protection for admin areas (`/admin`, `/api/admin`)
- **JWT Tokens**: Secure token-based authentication
- **RLS**: Row Level Security enabled on sensitive tables
- **Cookie-based**: HttpOnly cookies for secure session management
- **Admin Verification**: Multi-layer admin access control

### API Architecture

The API follows RESTful conventions with 18 major groups:
- Full CRUD operations for all entities
- Comprehensive admin endpoints with proper authorization
- Standardized response format with error handling
- Built-in pagination for large datasets
- Multiple authentication methods (Supabase session, manual auth)

## Development Guidelines

### TypeScript Configuration
- Paths configured for clean imports: `@/*`, `@components/*`, `@lib/*`, etc.
- Strict mode disabled for faster development
- Skip lib check enabled for performance

### Code Style
- ESLint extends Next.js core web vitals
- Prettier for code formatting
- React hooks rules enforced
- Warning level for non-critical issues

### Environment Requirements
Key environment variables needed:
```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key
SUPABASE_SERVICE_KEY=             # Service role key (for storage)
ASAAS_API_KEY=                    # Payment gateway key
NODE_ENV=                         # Environment mode
```

### Testing & Verification
- Use built-in scripts for system verification
- Test authentication flows before deployment
- Verify Supabase connection and permissions
- Test payment gateway integration

### Current Status
- **100% Functional**: All features implemented and working
- **Active Data**: 50 cities, 69 categories, 3+ active users
- **Storage**: Fully configured and operational
- **Ready**: For production deployment

### Common Development Tasks

#### Working with APIs
- All API routes follow the pattern `/api/[resource]/[action]`
- Admin routes require authentication middleware
- Use standardized error responses
- Implement proper pagination for listings

#### Database Operations
- Use Supabase client for database operations
- Implement RLS policies for data security
- Use stored procedures for complex operations
- Follow the established schema patterns

#### File Uploads
- Images stored in Supabase Storage
- Multiple image support per advertisement
- Automatic image optimization and resizing
- Secure upload with authentication

### Key Files to Understand
- `middleware.ts`: Authentication and route protection
- `app/lib/supabase.js`: Database client configuration
- `app/lib/authUtils.js`: Authentication utilities
- `docs/API.md`: Complete API documentation
- `docs/DESENVOLVIMENTO.md`: Development status and checklist
- `docs/technical/`: Technical documentation (tests, design, security, auth)
- `docs/admin/PAINEL.md`: Administrative panel documentation
- `database/schema.sql`: Complete database schema