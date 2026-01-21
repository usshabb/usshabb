# Vercel Production Deployment Guide

This guide will help you deploy the application to Vercel for production use.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm install -g vercel`
3. All required environment variables configured (see below)

## Required Environment Variables

The following environment variables must be configured in your Vercel project settings:

### Database Configuration
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`)

### ImageKit Configuration
For file upload functionality:
- `IMAGEKIT_PUBLIC_KEY` - Your ImageKit public key
- `IMAGEKIT_PRIVATE_KEY` - Your ImageKit private key
- `IMAGEKIT_URL_ENDPOINT` - Your ImageKit URL endpoint (e.g., `https://ik.imagekit.io/your_endpoint`)

### AI Integration (OpenAI)
For chat and document analysis features:
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL (default: `https://api.openai.com`)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Your OpenAI API key

**Note:** The `PORT` environment variable is automatically set by Vercel and should not be configured manually.

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Navigate to your project directory:
   ```bash
   cd /path/to/your/project
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

4. Follow the prompts to link your project or create a new one.

### Option 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to https://vercel.com/dashboard

3. Click "Add New Project"

4. Import your Git repository

5. Configure environment variables:
   - Go to "Settings" → "Environment Variables"
   - Add all required environment variables listed above
   - Make sure to add them for "Production" environment

6. Deploy by clicking "Deploy"

## Post-Deployment Configuration

### Environment Variables Setup

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each environment variable listed above
4. Redeploy the project after adding all variables

### Domain Configuration

1. Go to Settings → Domains in your Vercel project
2. Add your custom domain (optional)
3. Configure DNS records as instructed by Vercel

## Vercel Configuration Details

The project is configured with the following Vercel settings (in `vercel.json`):

- **Runtime:** Node.js 20.x
- **Max Duration:** 60 seconds (suitable for Pro plan)
- **Memory:** 1024 MB
- **Region:** iad1 (US East - Washington, D.C.)

### Region Selection

The default region is set to `iad1` (US East). You can change this in `vercel.json` based on your user base:

- `iad1` - US East (Washington, D.C.)
- `sfo1` - US West (San Francisco)
- `cdg1` - Europe (Paris)
- `hnd1` - Asia (Tokyo)

## Build Process

The deployment process runs:
1. `npm install` - Installs dependencies
2. `npm run build` - Builds both client and server
   - Client builds to `dist/public`
   - Server builds to `dist/index.cjs`
3. Vercel packages the application as a serverless function

## Important Notes

### MongoDB Connection

- Ensure your MongoDB cluster allows connections from Vercel's IP addresses
- For MongoDB Atlas, add `0.0.0.0/0` to the IP whitelist or use Vercel's IP addresses
- Connection pooling is configured with min 2, max 10 connections

### File Uploads

- Files are uploaded to ImageKit, not stored on Vercel
- Maximum file size: 50MB
- Supported formats: PDF, images, and other document types

### Serverless Function Limitations

- Each request is handled independently (stateless)
- No session storage (the app doesn't use sessions)
- 60-second timeout for API requests (Pro plan) or 10 seconds (Hobby plan)
- Functions are automatically scaled based on traffic

### Performance Optimization

The build process:
- Bundles server dependencies to reduce cold start time
- Minifies all code for production
- Optimizes client assets with Vite

## Monitoring and Logs

### View Logs

1. Go to your Vercel project dashboard
2. Click on "Deployments"
3. Select a deployment
4. View "Functions" logs for server-side logs

### Runtime Logs

All console.log statements in the server code will appear in Vercel's function logs.

## Troubleshooting

### Build Failures

If the build fails:
1. Check that all dependencies are in `dependencies` (not `devDependencies`)
2. Ensure Node.js version compatibility (v20.x)
3. Review build logs in Vercel dashboard

### Runtime Errors

If the app doesn't work after deployment:
1. Verify all environment variables are set correctly
2. Check MongoDB connection string and IP whitelist
3. Verify ImageKit credentials
4. Check function logs in Vercel dashboard
5. Ensure API keys are valid and have proper permissions

### Database Connection Issues

If you see MongoDB connection errors:
1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas IP whitelist
3. Ensure database user has proper permissions
4. Check if MongoDB cluster is running

### Cold Starts

First request after inactivity may be slower due to:
- Database connection initialization
- Serverless function cold start

This is normal behavior for serverless deployments.

## Local Testing

To test the production build locally:

```bash
# Build the project
npm run build

# Start the production server
npm start
```

## Rollback

If you need to rollback to a previous deployment:
1. Go to Vercel dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

## Security Best Practices

1. Never commit `.env` file to version control
2. Rotate API keys regularly
3. Use strong MongoDB passwords
4. Enable MongoDB Atlas encryption at rest
5. Configure ImageKit with appropriate access controls
6. Monitor Vercel logs for suspicious activity

## Support

For issues specific to:
- **Vercel deployment:** Check Vercel documentation or support
- **MongoDB:** Check MongoDB Atlas documentation
- **ImageKit:** Check ImageKit documentation
- **OpenAI API:** Check OpenAI API documentation

## Cost Considerations

### Vercel Pricing
- Hobby plan: Free with limitations (10-second function timeout)
- Pro plan: Recommended for production (60-second timeout, better performance)

### External Services
- MongoDB Atlas: Check MongoDB pricing for your usage
- ImageKit: Check ImageKit pricing for storage and bandwidth
- OpenAI API: Pay per token usage

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Set up monitoring and alerts
3. Configure custom domain if needed
4. Set up CI/CD for automatic deployments
5. Document any production-specific configurations
