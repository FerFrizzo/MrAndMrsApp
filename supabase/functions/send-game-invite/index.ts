/// <reference types="https://deno.land/x/lambda/mod.ts" />
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://mrandmrs.tech'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@mrandmrs.tech'

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is not set')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
}

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set')
}

interface RequestBody {
  gameId: string
  partnerInterviewedEmail: string
  partnerInterviewedName: string
  creatorId: string
  creatorName: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()

    const { gameId, partnerInterviewedEmail, partnerInterviewedName, creatorId, creatorName } = body

    if (!gameId || !partnerInterviewedEmail || !creatorId) {
      console.error('Missing required fields:', { gameId, partnerInterviewedEmail, creatorId })
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(partnerInterviewedEmail)) {
      console.error('Invalid email format:', partnerInterviewedEmail)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client with service role key for admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Get the game details
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('game_name, access_code')
      .eq('id', gameId)
      .single()

    if (gameError) {
      console.error('Error fetching game:', gameError)
      throw new Error(`Error fetching game: ${gameError.message}`)
    }

    if (!game) {
      console.error('Game not found:', gameId)
      throw new Error('Game not found')
    }

    // Generate a random access code if one doesn't exist
    let accessCode = game.access_code
    if (!accessCode) {
      accessCode = generateRandomCode(6)
      
      // Update the game with the new access code
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          access_code: accessCode,
          status: 'ready_to_play'
        })
        .eq('id', gameId)

      if (updateError) {
        console.error('Error updating game with access code:', updateError)
        throw new Error(`Error updating game: ${updateError.message}`)
      }
    }

    // Generate a deep link URL for the app
    const deepLink = `${APP_URL}/join?code=${accessCode}&gameId=${gameId}`
    
    // For testing, use a universal link format
    const universalLink = `https://mrandmrs.page.link?link=${encodeURIComponent(deepLink)}&apn=com.yourdomain.mrandmrs&isi=123456789&ibi=com.yourdomain.mrandmrs`

    // Prepare the email content
    const emailSubject = `${creatorName} invited you to play "${game.game_name}"!`
    const emailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #8A4FFF; text-align: center;">You've Been Invited!</h2>
            
            <p>Hi ${partnerInterviewedName},</p>
            
            <p><strong>${creatorName}</strong> has invited you to play <strong>"${game.game_name}"</strong> in the Mr & Mrs App!</p>
            
            <p>This fun game will test how well you know each other. Ready to find out?</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${universalLink}" style="background-color: #8A4FFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold;">Play Now</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">If the button doesn't work, you can also open the app and enter this code: <strong>${accessCode}</strong></p>
            
            <p style="font-size: 14px; color: #666;">Don't have the app yet? Download it from the <a href="https://play.google.com/store/apps/details?id=com.yourdomain.mrandmrs">Google Play Store</a> or <a href="https://apps.apple.com/us/app/id123456789">Apple App Store</a>.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center;">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email using fetch to Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: partnerInterviewedEmail,
        subject: emailSubject,
        html: emailContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error from Resend API:', errorData)
      throw new Error(`Error sending email: ${errorData.message || response.statusText}`)
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Invitation sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error: any) {
    console.error('Error in send-game-invite function:', error)
    // Return error response with more details
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to generate a random code
function generateRandomCode(length: number): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluded similar-looking characters
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
} 