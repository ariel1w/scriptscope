import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

const twitterClient = client.readWrite;

export async function postTweet(content: string): Promise<string> {
  try {
    const tweet = await twitterClient.v2.tweet(content);
    return tweet.data.id;
  } catch (error) {
    console.error('Failed to post tweet:', error);
    throw error;
  }
}
