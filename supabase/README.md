# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Mr & Mrs App.

## Edge Functions

### send-game-invite

This Edge Function sends game invitations with magic links to users. It:

1. Generates a unique access code for the game
2. Creates a universal/deep link to the app with the access code
3. Sends an invitation email with the magic link to the target email
4. Updates the game status to 'pending'

## Deployment Instructions

### Prerequisites

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Environment Variables

Set up the following environment variables for your Edge Functions:

```bash
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set APP_URL=https://yourdomain.com
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
```

### Deploy Functions

Run the deployment script:

```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

Or deploy individual functions:

```bash
supabase functions deploy send-game-invite --no-verify-jwt
```

## Testing the Functions

You can test the functions using the Supabase CLI:

```bash
supabase functions serve --env-file .env.local
```

Then use curl or Postman to send a request:

```bash
curl -X POST http://localhost:54321/functions/v1/send-game-invite \
  -H "Content-Type: application/json" \
  -d '{"gameId":"your-game-id","targetEmail":"target@example.com","senderId":"your-user-id","senderName":"Your Name"}'
```

## Function Details

### send-game-invite

**Request Body**:
```json
{
  "gameId": "required-game-id",
  "targetEmail": "required-target-email",
  "senderId": "required-sender-id",
  "senderName": "optional-sender-name"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message"
}
``` 