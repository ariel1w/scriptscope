import Anthropic from '@anthropic-ai/sdk';
import { parseJSON, validateAnalysisJSON } from './json-repair';

const apiKey = process.env.ANTHROPIC_API_KEY!;

export const anthropic = new Anthropic({
  apiKey,
  timeout: 20 * 60 * 1000, // 20 minutes for comprehensive analysis
  maxRetries: 2,
});

export async function analyzeScript(scriptText: string, analysisPrompt: string) {
  try {

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16384, // Maximum allowed for Sonnet
      messages: [
        {
          role: 'user',
          content: `${analysisPrompt}\n\n${scriptText}`,
        },
      ],
    });


    const content = message.content[0];
    if (content.type === 'text') {
      const text = content.text;


      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[AI] No JSON found in response');
        console.error('[AI] Response preview:', text.substring(0, 500));
        throw new Error('No JSON found in AI response');
      }


      // Use robust JSON parser with error recovery
      try {
        const parsed = parseJSON(jsonMatch[0]);

        // Validate the parsed object has required fields
        if (!validateAnalysisJSON(parsed)) {
          console.warn('[AI] Parsed JSON is missing required fields, but continuing anyway...');
        }

        return parsed;
      } catch (parseError) {
        console.error('[AI] JSON parsing failed completely');
        console.error('[AI] Parse error:', (parseError as Error).message);

        // Try to return a minimal valid object to avoid complete failure
        return createMinimalValidResponse(text);
      }
    }

    throw new Error('Unexpected response format from AI');
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
}

/**
 * Creates a minimal valid response when JSON parsing completely fails
 */
function createMinimalValidResponse(rawText: string): any {

  return {
    summary: {
      logline: 'Analysis failed - JSON parsing error',
      shortSynopsis: 'The AI generated an invalid response format. Please try again.',
      extendedSynopsis: rawText.substring(0, 1000) + '...'
    },
    classification: {
      format: 'Unknown',
      pageCount: 0,
      genre: { primary: 'Unknown', secondary: [] },
      tone: { description: 'Unable to analyze', comparables: [] },
      budgetTier: { tier: 'Unknown', justification: 'Analysis failed' }
    },
    characters: {
      fullList: [],
      connectionMap: 'Analysis incomplete',
      protagonistAnalysis: {
        name: 'N/A',
        description: 'Analysis failed',
        externalGoal: 'N/A',
        internalNeed: 'N/A',
        flaw: 'N/A',
        arc: 'N/A',
        transformation: 'N/A',
        effectiveness: 'N/A'
      },
      antagonistAnalysis: {
        name: 'N/A',
        description: 'Analysis failed',
        motivation: 'N/A',
        effectiveness: 'N/A'
      },
      supportingCharacters: []
    },
    storylines: {
      aStory: { description: 'Analysis incomplete', breakdown: 'N/A' },
      bStory: { description: 'Analysis incomplete', breakdown: 'N/A' },
      cStory: { description: 'N/A', breakdown: 'N/A' },
      integration: 'Analysis incomplete'
    },
    storyFundamentals: {
      emotionalEngine: { coreFeelings: [], consistency: 'N/A', analysis: 'Analysis failed' },
      incitingIncident: { description: 'N/A', pageNumber: 0, isEffective: false, analysis: 'N/A' },
      structure: {
        actBreaks: {
          act1End: { page: 0, event: 'N/A', assessment: 'N/A' },
          midpoint: { page: 0, event: 'N/A', assessment: 'N/A' },
          act2End: { page: 0, event: 'N/A', assessment: 'N/A' }
        },
        pacing: { dragPoints: [], rushPoints: [], analysis: 'N/A' },
        climax: { page: 0, description: 'N/A', payoff: 'N/A', earned: false, analysis: 'N/A' }
      },
      stakes: { personal: 'N/A', external: 'N/A', escalation: 'N/A', analysis: 'N/A' },
      theme: { central: 'N/A', secondary: [], execution: 'N/A', analysis: 'N/A' }
    },
    craft: {
      dialogue: { distinctiveness: 'N/A', voiceDistinction: 'N/A', subtext: 'N/A', efficiency: 'N/A', examples: { strong: [], weak: [] }, analysis: 'N/A' },
      visualStorytelling: { rating: 'N/A', showVsTell: 'N/A', memorableMoments: [], issues: [], analysis: 'N/A' },
      originality: { freshElements: [], derivativeElements: [], assessment: 'N/A' },
      openingPages: { hooks: false, entryPoint: 'N/A', firstImpression: 'N/A', analysis: 'N/A' },
      ending: { lands: false, earned: false, satisfying: false, emotionalImpact: 'N/A', analysis: 'N/A' }
    },
    commercialViability: {
      producibility: { locations: 'N/A', castSize: 'N/A', vfx: 'N/A', period: 'N/A', specialRequirements: [], complexity: 'N/A', rating: 'N/A', analysis: 'N/A' },
      castability: { starVehicles: [], ensembleAppeal: 'N/A', ageRanges: 'N/A', diversity: 'N/A', analysis: 'N/A' },
      marketPositioning: { targetAudience: 'N/A', buyers: [], distribution: 'N/A', positioning: 'N/A', analysis: 'N/A' }
    },
    developmentNotes: {
      overallGrade: 'N/A',
      numericScore: 0,
      assessment: 'Analysis failed due to technical error. Please try again or contact support.',
      whatsWorking: ['Unable to analyze - technical error occurred'],
      whatNeedsWork: ['Analysis could not be completed - please re-submit'],
      howToImprove: ['Re-upload your script to receive full analysis'],
      priorityFixes: ['Technical error prevented analysis - please try again'],
      encouragement: 'We apologize for the technical issue. Please re-submit your script for a complete analysis.'
    }
  };
}

export async function generateMarketingContent(platform: string, marketingPrompt: string) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${marketingPrompt}\n\nGenerate content for: ${platform}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const text = content.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in AI response');
    }

    throw new Error('Unexpected response format from AI');
  } catch (error) {
    console.error('AI marketing generation error:', error);
    throw error;
  }
}
