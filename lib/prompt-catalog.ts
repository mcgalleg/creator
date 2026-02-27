export interface PromptItem {
  label: string;
  prompt: string;
}

export interface PromptCategory {
  name: string;
  items: PromptItem[];
}

export const PROMPT_CATALOG: PromptCategory[] = [
  {
    name: 'Performance Overview',
    items: [
      { label: 'Account overview', prompt: 'Show me an overview of my account performance with key metrics' },
      { label: 'Top 10 videos', prompt: 'What are my top 10 performing videos this month by engagement rate?' },
      { label: 'Metrics breakdown', prompt: 'Show me a breakdown of my total views, likes, shares, and comments' },
      { label: 'Best vs worst', prompt: 'Compare my best and worst performing videos and explain why' },
      { label: 'Average engagement', prompt: 'What is my average engagement rate across all videos?' },
      { label: 'Duration vs engagement', prompt: 'How does video duration affect my engagement rate?' },
      { label: 'Last 10 posts', prompt: 'How are my last 10 posts performing compared to my average?' },
      { label: 'Best day of week', prompt: 'Which day of the week do my videos perform best?' },
    ],
  },
  {
    name: 'Content Strategy',
    items: [
      { label: 'Best times to post', prompt: 'What are my best times to post based on historical performance?' },
      { label: 'Optimal duration', prompt: 'What video duration gets me the most engagement?' },
      { label: 'Top hashtags', prompt: 'Which hashtags drive the most views and engagement for me?' },
      { label: 'Best sounds', prompt: 'Which songs or sounds have worked best in my videos?' },
      { label: 'Posting frequency', prompt: 'How does my posting frequency correlate with engagement?' },
      { label: 'Caption length', prompt: 'How does caption length affect my video performance?' },
      { label: 'Hashtag combos', prompt: 'What hashtag combinations perform best together?' },
      { label: 'Content ideas', prompt: 'Give me 5 content ideas based on what performs best for me' },
    ],
  },
  {
    name: 'Audience & Comments',
    items: [
      { label: 'Top commenters', prompt: 'Who are my most active commenters and how engaged are they?' },
      { label: 'Comment themes', prompt: 'What are the most common themes in my comments?' },
      { label: 'Audience geography', prompt: 'Where are my commenters from geographically?' },
      { label: 'Comment languages', prompt: 'What languages do my audience comment in?' },
      { label: 'High-follower commenters', prompt: 'Which commenters have the highest follower counts?' },
      { label: 'Comments vs views', prompt: 'Which of my videos get the most comments relative to views?' },
      { label: 'Heart rate', prompt: 'How often do I heart comments from my audience?' },
      { label: 'Comment volume trend', prompt: 'How has my comment volume changed over time?' },
    ],
  },
  {
    name: 'Growth & Trends',
    items: [
      { label: 'Follower growth', prompt: 'Show me my follower growth trend over time' },
      { label: 'Growth rate', prompt: 'What is my weekly and monthly follower growth rate?' },
      { label: 'Engagement trend', prompt: 'How has my engagement rate trended over the past month?' },
      { label: 'Viral posts', prompt: 'Which of my posts went viral and what do they have in common?' },
      { label: 'Likes growth', prompt: 'Show me how my total likes have grown over time' },
      { label: 'Posting frequency trend', prompt: 'How has my posting frequency changed over time?' },
      { label: 'Follower milestones', prompt: 'When did I hit my biggest follower milestones?' },
      { label: 'Saves trend', prompt: 'How have my saves trended — which content gets bookmarked most?' },
    ],
  },
  {
    name: 'Collaborations',
    items: [
      { label: 'Collab performance', prompt: 'Who have I collaborated with and how did those videos perform?' },
      { label: 'Solo vs collab', prompt: 'Do my collaboration videos perform better than solo content?' },
      { label: 'Verified collabs', prompt: 'Which verified creators have I collaborated with?' },
      { label: 'Collaborator reach', prompt: 'What is the total follower reach of my collaborators?' },
      { label: 'Frequent collaborators', prompt: 'Who are my most frequent collaborators?' },
    ],
  },
  {
    name: 'Saves & Shares',
    items: [
      { label: 'Highest save rate', prompt: 'Which videos have the highest save rate and why?' },
      { label: 'Most shared', prompt: 'Which videos get shared the most and what do they have in common?' },
      { label: 'Saves vs shares', prompt: 'How do my save rates compare to my share rates across content?' },
      { label: 'Virality score', prompt: 'Rank my videos by virality score based on shares to views ratio' },
      { label: 'Save rate trend', prompt: 'How has my save rate trended over the past month?' },
    ],
  },
];
