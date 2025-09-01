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

  async getCampaigns(adAccountId: string, dateRange: { since: string, until: string } = { 
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  }): Promise<FacebookCampaign[]> {
    try {
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
      
      // Return mock data for development
      return this.getMockCampaigns()
    }
  }

  private getMockCampaigns(): FacebookCampaign[] {
    return [
      {
        id: '1',
        name: 'Campanha Storie 25-08',
        spend: 150.00,
        results: 25,
        reach: 5000,
        impressions: 8500,
        cpm: 17.65,
        cpc: 6.00,
        ctr: 2.94,
        date_start: '2024-08-25',
        date_stop: '2024-08-31'
      },
      {
        id: '2',
        name: 'Tarot Consultas - Setembro',
        spend: 300.00,
        results: 45,
        reach: 8200,
        impressions: 12000,
        cpm: 25.00,
        cpc: 6.67,
        ctr: 3.75,
        date_start: '2024-09-01',
        date_stop: '2024-09-30'
      },
      {
        id: '3',
        name: 'Promoção Mandala Amorosa',
        spend: 80.00,
        results: 12,
        reach: 2500,
        impressions: 4200,
        cpm: 19.05,
        cpc: 6.67,
        ctr: 2.86,
        date_start: '2024-08-15',
        date_stop: '2024-08-20'
      },
      {
        id: '4',
        name: 'Espiada no Ex - Especial',
        spend: 220.00,
        results: 35,
        reach: 6800,
        impressions: 10500,
        cpm: 20.95,
        cpc: 6.29,
        ctr: 3.33,
        date_start: '2024-08-10',
        date_stop: '2024-08-25'
      }
    ]
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