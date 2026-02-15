import { TwitterApi, TwitterApiReadWrite } from 'twitter-api-v2';

// Lazy initialization to avoid errors during build
let twitterClient: TwitterApiReadWrite | null = null;

function getTwitterClient() {
  if (!twitterClient) {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || 'placeholder',
      appSecret: process.env.TWITTER_API_SECRET || 'placeholder',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || 'placeholder',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || 'placeholder',
    });
    twitterClient = client.readWrite;
  }
  return twitterClient;
}

export async function postTweet(content: string): Promise<string> {
  try {
    const client = getTwitterClient();
    const tweet = await client.v2.tweet(content);
    return tweet.data.id;
  } catch (error) {
    console.error('Failed to post tweet:', error);
    throw error;
  }
}
