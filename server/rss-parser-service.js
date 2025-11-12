// Minimal RSS Parser Service stub
// Provides parseRSSFeed and importRSSItems used by RSSAggregationService

export async function parseRSSFeed(feedUrl, feedId = null) {
  // Lightweight placeholder: return a structure similar to a parsed feed
  return {
    title: `Feed: ${feedUrl}`,
    link: feedUrl,
    items: []
  };
}

export async function importRSSItems(items, feed) {
  // Placeholder import logic: count items, no DB writes
  return {
    imported: 0,
    skipped: items?.length ?? 0,
    errors: 0
  };
}

const RSSParserService = { parseRSSFeed, importRSSItems };
export default RSSParserService;