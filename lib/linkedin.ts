import axios from 'axios';

const accessToken = process.env.LINKEDIN_ACCESS_TOKEN!;
const companyId = process.env.LINKEDIN_COMPANY_ID!;

export async function postToLinkedIn(content: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:organization:${companyId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Failed to post to LinkedIn:', error);
    throw error;
  }
}
