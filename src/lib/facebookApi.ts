import { FacebookCampaign } from './types'

const FACEBOOK_ACCESS_TOKEN = 'EAASQgZBKZCCrMBPezAbc8qZB3sEVRXyTZAYTo6aJh0oVI8ppVgd42YrGjTwPhe2TXIiAo7oyqFsAdZA4SDXgcrV3TYn5PtDfRXifVN398WhiO6HZAxdvT2zLuCon6xzdm8fUpYjZAerEMlZCdT23fecntaUzneKqlynqDG2M72NDcM94JSf1kpZAFmr98nirZCK8McN1ZA3'

class FacebookAPI {
  private accessToken: string

  constructor() {
    this.accessToken = FACEBOOK_ACCESS_TOKEN
  }

  async getAdAccounts() {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${this.accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.data
    } catch (error) {
      console.error('Error fetching ad accounts:', error)
      throw error
    }
  }

  async getCampaigns(adAccountId?: string, dateRange: { since: string, until: string } = { 
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  }): Promise<FacebookCampaign[]> {
    try {
      // First get ad accounts if no account ID provided
      if (!adAccountId) {
        const accounts = await this.getAdAccounts()
        if (accounts.length === 0) {
          throw new Error('No ad accounts found')
        }
        adAccountId = accounts[0].id
      }

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
        access_token: this.accessToken,
        fields: fields,
        time_range: JSON.stringify({
          since: dateRange.since,
          until: dateRange.until
        }),
        level: 'campaign',
        limit: '100'
      })

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${adAccountId}/insights?${params}`
      )
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      return data.data.map((campaign: any) => ({
        id: campaign.campaign_id || campaign.campaign_name,
        name: campaign.campaign_name,
        spend: parseFloat(campaign.spend || '0'),
        results: parseInt(campaign.results || '0'),
        reach: parseInt(campaign.reach || '0'),
        impressions: parseInt(campaign.impressions || '0'),
        cpm: parseFloat(campaign.cpm || '0'),
        cpc: parseFloat(campaign.cpc || '0'),
        ctr: parseFloat(campaign.ctr || '0'),
        date_start: dateRange.since,
        date_stop: dateRange.until
      }))
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      throw error
    }
  }


  async getCampaignROAS(campaignName: string, totalRevenue: number): Promise<{ spend: number, revenue: number, roas: number }> {
    // This would ideally get the actual spend from Facebook API
    // For now, we'll use mock data or calculate from stored campaigns
    const mockSpend = 100 // This should come from actual Facebook data
    
    return {
      spend: mockSpend,
      revenue: totalRevenue,
      roas: totalRevenue / mockSpend
    }
  }
}

export const facebookAPI = new FacebookAPI()