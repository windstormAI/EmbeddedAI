# 🚀 AI-Embedded Systems Design Platform - Netlify + Supabase Deployment Guide

This guide covers the complete deployment process for the AI-Embedded Systems Design Platform using Netlify + Supabase with subscription management.

## 📋 Prerequisites

### Accounts & Services
- [Netlify Account](https://netlify.com) - For hosting and serverless functions
- [Supabase Account](https://supabase.com) - For backend services and database
- [Stripe Account](https://stripe.com) - For payment processing
- [OpenAI Account](https://openai.com) - For AI features

### Development Tools
- Node.js 18+ and npm
- Git
- Supabase CLI (`npm install -g supabase`)
- Netlify CLI (`npm install -g netlify-cli`)

## 🏗️ Step 1: Supabase Setup

### 1.1 Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create new project
supabase init ai-embedded-platform
cd ai-embedded-platform

# Link to your Supabase project
supabase link --project-ref your-project-ref
```

### 1.2 Configure Supabase
```bash
# Copy environment template
cp supabase/config.toml.example supabase/config.toml

# Edit config.toml with your project settings
# Update project_id and other settings as needed
```

### 1.3 Database Setup
```bash
# Start local Supabase (for development)
supabase start

# Apply database migrations
supabase db push

# Generate types (optional)
supabase gen types typescript --local > src/types/supabase.ts
```

### 1.4 Supabase Dashboard Configuration

1. **Authentication Settings:**
   - Go to Authentication > Settings
   - Configure site URL: `https://your-netlify-site.netlify.app`
   - Add redirect URLs for OAuth providers

2. **Database Tables:**
   - The migration file will create all necessary tables
   - Enable Row Level Security (RLS) on all tables

3. **Storage Setup:**
   - Create buckets for user uploads
   - Configure storage policies

4. **Edge Functions (Optional):**
   - Deploy serverless functions to Supabase
   - Configure function URLs

## 💳 Step 2: Stripe Setup

### 2.1 Create Stripe Products
```bash
# Install Stripe CLI
npm install -g stripe

# Login to Stripe
stripe login

# Create products and prices
stripe products create --name="AI Embedded Pro" --description="Professional plan"
stripe products create --name="AI Embedded Enterprise" --description="Enterprise plan"

# Create prices
stripe prices create --product="prod_pro_id" --unit-amount=1900 --currency=usd --recurring --recurring-interval=month
stripe prices create --product="prod_enterprise_id" --unit-amount=4900 --currency=usd --recurring --recurring-interval=month
```

### 2.2 Update Environment Variables
```bash
# In your .env file
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2.3 Configure Webhooks
```bash
# Create webhook endpoint for subscription events
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

## 🌐 Step 3: Netlify Setup

### 3.1 Connect Repository
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify site
netlify init

# Or link existing site
netlify link
```

### 3.2 Configure Build Settings
The `netlify.toml` file is already configured with:
- Build command: `cd client && npm run build`
- Publish directory: `client/build`
- Environment variables
- Redirect rules
- Security headers

### 3.3 Environment Variables
Set these in Netlify dashboard or via CLI:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# OpenAI
OPENAI_API_KEY=your-openai-key

# Application
NODE_ENV=production
```

## 🔧 Step 4: Application Configuration

### 4.1 Update Client Configuration
```javascript
// client/src/utils/supabase.js
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

### 4.2 Update Subscription Plans
```javascript
// client/src/components/subscription/SubscriptionManager.js
const SUBSCRIPTION_PLANS = {
  pro: {
    stripePriceId: 'price_your_pro_price_id'
  },
  enterprise: {
    stripePriceId: 'price_your_enterprise_price_id'
  }
};
```

### 4.3 Configure AI Features
```javascript
// Update OpenAI API key in environment
OPENAI_API_KEY=your_production_openai_key
```

## 🚀 Step 5: Deployment

### 5.1 Deploy to Netlify
```bash
# Build and deploy
netlify deploy --prod

# Or push to repository for automatic deployment
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 5.2 Verify Deployment
```bash
# Check deployment status
netlify status

# Open deployed site
netlify open

# Check functions
netlify functions:list
```

## 🔒 Step 6: Security Configuration

### 6.1 Supabase Security
```sql
-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies (already in migration file)
-- Users can only access their own data
```

### 6.2 Netlify Security
- **Form Handling:** Configure form submissions
- **Function Permissions:** Set appropriate permissions for serverless functions
- **Domain Configuration:** Set up custom domain and SSL

### 6.3 Stripe Webhooks
```javascript
// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
        // Handle subscription creation
        break;
      case 'customer.subscription.updated':
        // Handle subscription updates
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
    }

    return { statusCode: 200 };
  } catch (error) {
    return { statusCode: 400, body: error.message };
  }
};
```

## 📊 Step 7: Monitoring & Analytics

### 7.1 Supabase Monitoring
- **Database Performance:** Monitor query performance
- **Real-time Metrics:** Track active connections
- **Storage Usage:** Monitor file storage

### 7.2 Netlify Analytics
- **Build Metrics:** Track build times and success rates
- **Function Metrics:** Monitor serverless function performance
- **Bandwidth Usage:** Track data transfer

### 7.3 Stripe Analytics
- **Revenue Metrics:** Track subscription revenue
- **Churn Analysis:** Monitor subscription cancellations
- **Payment Success:** Track payment completion rates

## 🔄 Step 8: Subscription Management

### 8.1 User Onboarding
1. **Free Trial:** Allow users to try features
2. **Plan Selection:** Clear pricing and feature comparison
3. **Payment Flow:** Seamless Stripe integration
4. **Role Assignment:** Automatic role updates based on subscription

### 8.2 Feature Access Control
```javascript
// Check subscription status
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single();

// Enable/disable features based on plan
const hasProAccess = subscription?.plan_name?.toLowerCase().includes('pro');
```

### 8.3 Billing Management
- **Automatic Billing:** Stripe handles recurring payments
- **Failed Payments:** Automatic retry and dunning management
- **Plan Changes:** Allow users to upgrade/downgrade
- **Cancellation:** Graceful subscription cancellation

## 🧪 Step 9: Testing

### 9.1 Pre-deployment Testing
```bash
# Test Supabase connection
npm run test:supabase

# Test Stripe integration
npm run test:stripe

# Test Netlify functions locally
netlify dev
```

### 9.2 Post-deployment Testing
- **User Registration:** Test complete signup flow
- **Subscription Purchase:** Test payment processing
- **Feature Access:** Verify plan-based feature restrictions
- **Real-time Features:** Test collaboration and live updates

## 🚨 Step 10: Production Checklist

### Pre-Launch
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Stripe webhooks configured
- [ ] Domain and SSL certificates
- [ ] Custom domain configured
- [ ] Email templates configured

### Security
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] API rate limiting active
- [ ] Input validation implemented
- [ ] Authentication working

### Performance
- [ ] Assets optimized
- [ ] Caching configured
- [ ] CDN enabled
- [ ] Database indexes created

### Monitoring
- [ ] Error tracking configured
- [ ] Analytics enabled
- [ ] Performance monitoring active
- [ ] Backup strategy implemented

## 🔧 Maintenance & Updates

### Regular Tasks
```bash
# Update dependencies
npm audit fix
npm update

# Database maintenance
supabase db push

# Monitor performance
netlify logs
supabase logs
```

### Scaling Considerations
- **Database:** Monitor query performance and add indexes as needed
- **Functions:** Optimize serverless function performance
- **Storage:** Implement file cleanup and optimization
- **Caching:** Add Redis for improved performance

## 🆘 Troubleshooting

### Common Issues
1. **Build Failures:** Check environment variables and build logs
2. **Database Connection:** Verify Supabase credentials and network access
3. **Stripe Integration:** Check webhook endpoints and API keys
4. **Function Timeouts:** Optimize serverless function performance

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Stripe Documentation](https://stripe.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🎯 Success Metrics

### Technical Metrics
- **Uptime:** 99.9%+ availability
- **Response Time:** <500ms API responses
- **Build Success:** 100% successful deployments
- **Error Rate:** <1% application errors

### Business Metrics
- **Conversion Rate:** Track free to paid conversions
- **Retention Rate:** Monitor subscription renewals
- **User Engagement:** Track feature usage and time spent
- **Revenue Growth:** Monitor MRR and ARR growth

---

## 🚀 Launch Command

```bash
# Final deployment
git add .
git commit -m "Production deployment ready"
git push origin main

# Monitor deployment
netlify status
netlify logs

# Celebrate! 🎉
echo "AI-Embedded Systems Design Platform is now live!"
```

Your AI-Embedded Systems Design Platform is now ready for production deployment with Netlify + Supabase! The subscription model will allow you to monetize the platform while providing users with access to powerful embedded systems design tools.