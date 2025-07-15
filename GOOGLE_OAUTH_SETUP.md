# Google OAuth Setup Guide

## Prerequisites

1. **Google Cloud Console Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API and Google Sign-In API

2. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in the required information (app name, user support email, developer contact)
   - Add your app's domain to authorized domains

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - In "Authorized redirect URIs", add both:
     - `https://ggpjulailsggugazzrsb.supabase.co/auth/v1/callback` (for web)
     - `mrandmrsapp://auth/callback` (for mobile app)
   - Copy the **Client ID** and **Client Secret** - you'll need these for Supabase

## Supabase Configuration

1. **Configure Google Provider in Supabase**
   - Go to your Supabase dashboard: https://supabase.com/dashboard
   - Select your project (ggpjulailsggugazzrsb)
   - Navigate to "Authentication" > "Providers"
   - Find "Google" in the list and click the toggle to enable it
   - Add your Google OAuth credentials:
     - **Client ID**: Your Google Web Client ID (from Google Cloud Console)
     - **Client Secret**: Your Google Web Client Secret (from Google Cloud Console)
   - The redirect URL should be: `https://ggpjulailsggugazzrsb.supabase.co/auth/v1/callback` (this is automatically set by Supabase)

2. **Environment Variables**
   Create a `.env` file in your project root with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## App Configuration

The app is already configured with:
- OAuth redirect scheme: `mrandmrsapp://auth/callback`
- Google Sign-In component integrated into the SignIn screen
- Proper error handling and user feedback

## Testing

1. Run your app
2. Go to the Sign In screen
3. Tap the Google sign-in button
4. Complete the OAuth flow
5. You should be redirected back to your app and signed in

## Troubleshooting

- **"This site can't be reached" in browser**: This happens when using web OAuth redirect URLs in mobile apps. Make sure you've added the mobile redirect URI (`mrandmrsapp://auth/callback`) to your Google OAuth settings
- **"Invalid redirect URI"**: Make sure both redirect URLs are added in Google Cloud Console (web and mobile)
- **"OAuth consent screen not configured"**: Complete the OAuth consent screen setup in Google Cloud Console
- **"Client ID not found"**: Verify your Google OAuth credentials are correct in Supabase
- **"Network error"**: Check your internet connection and Supabase URL
- **App doesn't handle redirect**: Ensure your app's URL scheme (`mrandmrsapp`) is properly configured in app.json

## Security Notes

- Never commit your `.env` file to version control
- Keep your Google Client Secret secure
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials 