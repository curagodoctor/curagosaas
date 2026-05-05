import mongoose from 'mongoose';

/**
 * GMB Insight Model
 * Stores GMB Insights data including search keywords
 */
const GmbInsightSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  gmbConnectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GmbConnection',
    required: true,
  },

  // Time period
  periodStart: {
    type: Date,
    required: true,
  },
  periodEnd: {
    type: Date,
    required: true,
  },
  periodType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },

  // Search Keywords
  searchKeywords: [{
    keyword: { type: String, required: true },
    impressions: { type: Number, default: 0 },
    rank: { type: Number }, // Position in search results
  }],

  // Discovery Metrics (How customers find the business)
  directSearches: {
    type: Number,
    default: 0,
  },
  discoverySearches: {
    type: Number,
    default: 0,
  },
  brandedSearches: {
    type: Number,
    default: 0,
  },

  // Action Metrics
  websiteClicks: {
    type: Number,
    default: 0,
  },
  phoneClicks: {
    type: Number,
    default: 0,
  },
  directionRequests: {
    type: Number,
    default: 0,
  },

  // Photo Metrics
  photoViews: {
    type: Number,
    default: 0,
  },
  photoCount: {
    type: Number,
    default: 0,
  },

  // Views
  mapsViews: {
    type: Number,
    default: 0,
  },
  searchViews: {
    type: Number,
    default: 0,
  },

  // Last synced
  lastSyncAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
GmbInsightSchema.index({ doctorId: 1, periodStart: 1, periodType: 1 }, { unique: true });
GmbInsightSchema.index({ gmbConnectionId: 1, periodStart: -1 });

// Static method to get top keywords for a doctor
GmbInsightSchema.statics.getTopKeywords = async function(doctorId, days = 30, limit = 20) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const insights = await this.find({
    doctorId,
    periodStart: { $gte: startDate },
  });

  // Aggregate keywords across all periods
  const keywordMap = new Map();
  insights.forEach(insight => {
    insight.searchKeywords.forEach(kw => {
      const existing = keywordMap.get(kw.keyword) || { impressions: 0 };
      keywordMap.set(kw.keyword, {
        keyword: kw.keyword,
        impressions: existing.impressions + kw.impressions,
      });
    });
  });

  // Sort by impressions and limit
  return Array.from(keywordMap.values())
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
};

// Static method to get aggregated stats for a doctor
GmbInsightSchema.statics.getAggregatedStats = async function(doctorId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        periodStart: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalSearches: { $sum: { $add: ['$directSearches', '$discoverySearches', '$brandedSearches'] } },
        directSearches: { $sum: '$directSearches' },
        discoverySearches: { $sum: '$discoverySearches' },
        brandedSearches: { $sum: '$brandedSearches' },
        websiteClicks: { $sum: '$websiteClicks' },
        phoneClicks: { $sum: '$phoneClicks' },
        directionRequests: { $sum: '$directionRequests' },
        mapsViews: { $sum: '$mapsViews' },
        searchViews: { $sum: '$searchViews' },
        photoViews: { $sum: '$photoViews' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalSearches: 0,
      directSearches: 0,
      discoverySearches: 0,
      brandedSearches: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      directionRequests: 0,
      mapsViews: 0,
      searchViews: 0,
      photoViews: 0,
      totalActions: 0,
    };
  }

  const s = stats[0];
  return {
    ...s,
    _id: undefined,
    totalActions: s.websiteClicks + s.phoneClicks + s.directionRequests,
  };
};

export default mongoose.models.GmbInsight || mongoose.model('GmbInsight', GmbInsightSchema);
