import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookCampaign {
  id: string
  name: string
  spend: number
  results: number
  reach: number
  impressions: number
  cpm: number
  cpc: number
  ctr: number
  date_start: string
  date_stop: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Facebook Campaigns function called')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { adAccountId, dateRange } = await req.json()
    console.log('Request params:', { adAccountId, dateRange })

    const accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN')
    if (!accessToken) {
      console.error('Facebook access token not found')
      throw new Error('Facebook access token not configured')
    }

    // Use the specific account ID provided by the user
    const accountId = adAccountId || 'act_776827264799644'
    console.log('Using account ID:', accountId)

    const fields = [
      'campaign_name',
      'spend',
      'results',
      'reach',
      'impressions',
      'cpm',
      'cpc',
      'ctr',
      'actions'
    ].join(',')

    const params = new URLSearchParams({
      access_token: accessToken,
      fields: fields,
      time_range: JSON.stringify({
        since: dateRange?.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        until: dateRange?.until || new Date().toISOString().split('T')[0]
      }),
      level: 'campaign',
      limit: '100'
    })

    console.log('Calling Facebook API with params:', params.toString())

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/insights?${params}`
    )
    
    const data = await response.json()
    console.log('Facebook API response:', data)
    
    if (data.error) {
      console.error('Facebook API error:', data.error)
      throw new Error(data.error.message)
    }

    const campaigns: FacebookCampaign[] = data.data.map((campaign: any) => ({
      id: campaign.campaign_id || campaign.campaign_name,
      name: campaign.campaign_name,
      spend: parseFloat(campaign.spend || '0'),
      results: parseInt(campaign.results || '0'),
      reach: parseInt(campaign.reach || '0'),
      impressions: parseInt(campaign.impressions || '0'),
      cpm: parseFloat(campaign.cpm || '0'),
      cpc: parseFloat(campaign.cpc || '0'),
      ctr: parseFloat(campaign.ctr || '0'),
      date_start: dateRange?.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_stop: dateRange?.until || new Date().toISOString().split('T')[0]
    }))

    console.log('Processed campaigns:', campaigns)

    // Store campaigns in Supabase
    if (campaigns.length > 0) {
      console.log('Storing campaigns in database...')
      
      // Clear existing campaigns for this date range first
      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .gte('start_date', dateRange?.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('end_date', dateRange?.until || new Date().toISOString().split('T')[0])

      if (deleteError) {
        console.error('Error deleting old campaigns:', deleteError)
      }

      // Insert new campaigns
      const campaignData = campaigns.map(campaign => ({
        name: campaign.name,
        spend: campaign.spend,
        leads: campaign.results,
        start_date: campaign.date_start,
        end_date: campaign.date_stop,
        active: true
      }))

      const { error: insertError } = await supabase
        .from('campaigns')
        .insert(campaignData)

      if (insertError) {
        console.error('Error inserting campaigns:', insertError)
      } else {
        console.log('Campaigns stored successfully')
      }
    }

    return new Response(
      JSON.stringify({ success: true, campaigns }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in facebook-campaigns function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch campaigns', 
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})