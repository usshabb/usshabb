# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel production.

## Pre-Deployment

- [ ] All code changes committed to Git
- [ ] Production build tested locally (`npm run build` && `npm start`)
- [ ] `.env` file is NOT committed (check `.gitignore`)
- [ ] MongoDB Atlas cluster is running and accessible
- [ ] MongoDB Atlas IP whitelist configured (allow Vercel IPs or `0.0.0.0/0`)

## Environment Variables Setup

Configure these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `IMAGEKIT_PUBLIC_KEY` - ImageKit public key
- [ ] `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- [ ] `IMAGEKIT_URL_ENDPOINT` - ImageKit endpoint URL
- [ ] `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL
- [ ] `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key

**Important:** Set all variables for "Production" environment.

## Vercel Project Settings

- [ ] Build Command: `npm run build` (should be auto-detected)
- [ ] Install Command: `npm install` (should be auto-detected)
- [ ] Output Directory: `dist/public` (configured in vercel.json)
- [ ] Node.js Version: 20.x (configured in vercel.json)

## Deployment Steps

### First-Time Deployment

1. [ ] Push code to Git repository (GitHub/GitLab/Bitbucket)
2. [ ] Connect repository to Vercel
3. [ ] Configure environment variables
4. [ ] Deploy

OR use CLI:

```bash
vercel login
vercel --prod
```

### Subsequent Deployments

- [ ] Push to main branch (auto-deploys if connected)
- OR run `vercel --prod` from CLI

## Post-Deployment Verification

- [ ] Visit deployed URL and verify homepage loads
- [ ] Test folder creation
- [ ] Test file upload (ImageKit)
- [ ] Test document upload (PDF)
- [ ] Test AI chat feature (OpenAI)
- [ ] Check Vercel function logs for errors
- [ ] Verify database connections are working

## Troubleshooting

### If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `dependencies` (not `devDependencies`)
3. Check Node.js version compatibility

### If app doesn't work:
1. Check environment variables are set correctly
2. Check Vercel function logs
3. Verify MongoDB connection string
4. Test ImageKit credentials
5. Verify OpenAI API key

### If database connection fails:
1. Check MongoDB Atlas IP whitelist
2. Verify MONGODB_URI format
3. Check database user permissions
4. Ensure MongoDB cluster is active

## Performance Monitoring

- [ ] Monitor function execution time in Vercel dashboard
- [ ] Check for cold start issues
- [ ] Monitor MongoDB connection pool usage
- [ ] Track API response times

## Security Review

- [ ] No sensitive data in code
- [ ] All API keys in environment variables
- [ ] MongoDB connection uses strong password
- [ ] ImageKit access controls configured
- [ ] Rate limiting considered for API endpoints

## Cost Optimization

- [ ] Monitor Vercel function invocations
- [ ] Monitor MongoDB Atlas usage
- [ ] Monitor ImageKit storage and bandwidth
- [ ] Monitor OpenAI API token usage
- [ ] Consider upgrading to Pro plan if hitting limits

## Rollback Plan

If issues occur in production:
1. [ ] Go to Vercel Dashboard → Deployments
2. [ ] Find last working deployment
3. [ ] Click "..." → "Promote to Production"

## Domain Setup (Optional)

- [ ] Add custom domain in Vercel settings
- [ ] Configure DNS records
- [ ] Verify SSL certificate

## CI/CD (Optional)

- [ ] Set up automatic deployments from Git
- [ ] Configure branch deployments (preview)
- [ ] Set up deployment notifications

## Documentation

- [ ] Update README with deployment info
- [ ] Document any production-specific configurations
- [ ] Share access with team members
- [ ] Document incident response procedures

## Final Checks

- [ ] All features tested in production
- [ ] Error monitoring in place
- [ ] Backup and recovery plan documented
- [ ] Team notified of deployment
- [ ] Support contact information updated

---

## Quick Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Pull environment variables
vercel env pull

# Link local project to Vercel
vercel link
```

## Support Resources

- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- ImageKit Docs: https://docs.imagekit.io/
- OpenAI API: https://platform.openai.com/docs

## Notes

- First deployment may take longer (5-10 minutes)
- Subsequent deployments are faster (2-5 minutes)
- Cold starts may cause first request to be slower
- Function timeout: 60 seconds (Pro) / 10 seconds (Hobby)
