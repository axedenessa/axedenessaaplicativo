import { FacebookCampaign } from './types'
import { supabase } from '@/integrations/supabase/client'

class FacebookAPI {
  async getCampaigns(adAccountId?: string, dateRange: { since: string, until: string } = { 
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  }): Promise<FacebookCampaign[]> {
    try {
      console.log('Calling Facebook campaigns edge function...')
      
      const { data, error } = await supabase.functions.invoke('facebook-campaigns', {
        body: { 
          adAccountId: adAccountId || 'act_776827264799644',
          dateRange 
        }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error(data.details || 'Failed to fetch campaigns')
      }

      console.log('Facebook campaigns fetched successfully:', data.campaigns)
      return data.campaigns
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      // Return empty array instead of throwing to prevent app crashes
      return []
    }
  }

  async getCampaignROAS(campaignName: string, totalRevenue: number): Promise<{ spend: number, revenue: number, roas: number }> {
    try {
      // Get campaign data from Supabase
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('spend')
        .ilike('name', `%${campaignName}%`)
        .single()

      const spend = campaigns?.spend || 100 // fallback to mock data
      
      return {
        spend,
        revenue: totalRevenue,
        roas: spend > 0 ? totalRevenue / spend : 0
      }
    } catch (error) {
      console.error('Error calculating ROAS:', error)
      return {
        spend: 100,
        revenue: totalRevenue,
        roas: totalRevenue / 100
      }
    }
  }
}

export const facebookAPI = new FacebookAPI()