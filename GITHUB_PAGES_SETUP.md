# GitHub Pages Setup for Mr & Mrs Game

This guide will help you set up GitHub Pages for your Mr & Mrs Game website, including the support page that Apple requires.

## Files Created

The following files have been created for your GitHub Pages site:

- `index.html` - Main landing page
- `support.html` - Support page (required by Apple)
- `privacy.html` - Privacy policy (already existed, updated with navigation)
- `.github/workflows/deploy-pages.yml` - GitHub Actions workflow for automatic deployment

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Configure Environment Protection Rules

If you get the error "Branch 'main' is not allowed to deploy to github-pages due to environment protection rules":

1. Go to **Settings** → **Environments**
2. Click on **github-pages** environment
3. Under **Environment protection rules**:
   - **Required reviewers**: Leave unchecked (or add yourself if you want manual approval)
   - **Wait timer**: Set to 0 minutes
   - **Deployment branches**: Select "All branches" or "Selected branches" and add "main"
4. Click **Save protection rules**

### 3. Configure Custom Domain (Optional)

If you want to use your custom domain `mrandmrs.tech`:

1. In the Pages settings, add your custom domain: `mrandmrs.tech`
2. Add a `CNAME` file to your repository root with the content: `mrandmrs.tech`
3. Configure your DNS settings to point to GitHub Pages:
   - Add a CNAME record: `www` → `yourusername.github.io`
   - Add an A record: `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

### 4. Update App Store Connect

Once your GitHub Pages site is live, update your App Store Connect:

1. Go to App Store Connect
2. Navigate to your app
3. Go to **App Information**
4. Update the **Support URL** to: `https://yourusername.github.io/MrAndMrsApp/support.html`
   - Or if using custom domain: `https://mrandmrs.tech/support.html`

### 5. Test the Setup

1. Push your changes to the main branch
2. GitHub Actions will automatically deploy your site
3. Visit your site to ensure everything works:
   - Main page: `https://yourusername.github.io/MrAndMrsApp/`
   - Support page: `https://yourusername.github.io/MrAndMrsApp/support.html`
   - Privacy page: `https://yourusername.github.io/MrAndMrsApp/privacy.html`

## File Structure

```
/
├── index.html              # Main landing page
├── support.html            # Support page (Apple requirement)
├── privacy.html            # Privacy policy
├── .github/
│   └── workflows/
│       └── deploy-pages.yml # GitHub Actions deployment
└── GITHUB_PAGES_SETUP.md   # This setup guide
```

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Consistent Styling**: Matches your app's purple theme (#8A2BE2)
- **Navigation**: Easy navigation between pages
- **Contact Information**: Clear support contact details
- **FAQ Section**: Common questions and answers
- **Automatic Deployment**: Updates automatically when you push changes

## Customization

You can customize the pages by editing:

- **Colors**: Update the CSS color variables in each HTML file
- **Content**: Modify the text content to match your needs
- **Contact Info**: Update email addresses and contact details
- **App Store Links**: Add actual download links when your app is published

## Troubleshooting

### "Branch 'main' is not allowed to deploy to github-pages due to environment protection rules"

This is the most common error. To fix it:

1. **Go to Repository Settings**:
   - Navigate to your repository on GitHub
   - Click **Settings** tab
   - Click **Environments** in the left sidebar

2. **Configure github-pages Environment**:
   - Click on **github-pages** environment
   - Under **Environment protection rules**:
     - **Required reviewers**: Uncheck this (unless you want manual approval)
     - **Wait timer**: Set to 0 minutes
     - **Deployment branches**: Select "All branches" or "Selected branches" and add "main"
   - Click **Save protection rules**

3. **Alternative: Manual Deployment**:
   - Go to **Actions** tab in your repository
   - Find the "Deploy to GitHub Pages" workflow
   - Click **Run workflow** button to manually trigger deployment

### GitHub Pages Not Updating
- Check the Actions tab in your repository for deployment status
- Ensure the workflow file is in the correct location: `.github/workflows/deploy-pages.yml`
- Make sure environment protection rules are properly configured

### Custom Domain Not Working
- Verify DNS settings are correct
- Check that the CNAME file is in the repository root
- Wait up to 24 hours for DNS propagation

### Styling Issues
- Check that all CSS is properly formatted
- Ensure file paths are correct
- Test on different browsers and devices

## Support

If you need help with the setup, contact:
- Email: support@mrandmrs.tech
- GitHub Issues: Create an issue in your repository

---

**Note**: Remember to update the App Store Connect support URL once your GitHub Pages site is live and working properly.
