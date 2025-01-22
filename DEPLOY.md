# Deploying to Netlify

## Build Settings

Configure the following settings in your Netlify dashboard for successful deployment:

### Basic Build Settings

- **Base directory**: `frontend/`
  - This is where Netlify will look for your source code

- **Package directory**: `frontend/`
  - Directory containing the site files and netlify.toml

- **Build command**: `pnpm --filter @chainlit/app... run build`
  - Command to build your application

- **Publish directory**: `frontend/dist`
  - Directory containing your built application files

- **Functions directory**: `netlify/functions`
  - Location of your serverless functions

### Environment Setup

1. Go to Site settings > Build & deploy
2. Set the following build settings:
   - Runtime: Node.js
   - Node version: 18 (or latest LTS)

### Deploy Settings

1. **Deploy log visibility**: Public logs
   - Anyone with deploy URL can access logs

2. **Build status**: Active builds
   - Netlify will automatically build on Git pushes

### Required Dependencies

Ensure your `package.json` includes:
```json
{
  "dependencies": {
    "@chainlit/app": "latest"
  },
  "devDependencies": {
    "vite": "latest"
  }
}
```

## Deployment Steps

1. Connect your repository to Netlify
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Select your repository
   - Configure build settings as above

2. Configure environment variables (if needed)
   - Go to Site settings > Build & deploy > Environment
   - Add any required environment variables

3. Deploy
   - Trigger deploy manually or push to your repository
   - Netlify will automatically build and deploy your site

## Post-Deployment

- Check build logs for any issues
- Verify your site is working correctly
- Set up custom domain if needed
- Configure SSL/TLS certificates

## Troubleshooting

If you encounter build issues:
1. Verify all build settings are correct
2. Check package.json dependencies
3. Review build logs for errors
4. Ensure all required environment variables are set

## Local Testing

Before deploying:
1. Run `pnpm install` in the frontend directory
2. Test build locally: `pnpm --filter @chainlit/app... run build`
3. Verify the build output in `frontend/dist`