# Agent Usage Tracker - Raycast Extension

Track usage and limits across multiple AI agents directly from Raycast. Monitor your token consumption, model usage, and stay informed about your API limits.

## Features

- 📊 Real-time usage tracking for AI agents
- 🔄 Quick refresh to get latest data
- 🎨 Color-coded usage indicators (green, yellow, orange, red)
- 🔐 Secure API key storage via Raycast preferences
- 📱 Clean, native Raycast interface

## Supported Agents

### Current

- **Claude Code** - Track Anthropic Claude API usage via token consumption
- **JetBrains Junie** - Track JetBrains AI Assistant usage via IDE Services API

### Coming Soon

- OpenAI GPT models
- Google PaLM/Gemini
- Cohere
- And more...

## Installation

### Prerequisites

- [Raycast](https://www.raycast.com/) (macOS only)
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Setup

1. Clone this repository:

```bash
git clone <repository-url>
cd silver-funicular
```

2. Install dependencies:

```bash
npm install
```

3. Convert SVG icons to PNG:

```bash
# You'll need to convert the SVG files in /assets to PNG format
# Use any SVG to PNG converter, or use the following if you have ImageMagick:
convert assets/icon.svg -resize 512x512 assets/icon.png
convert assets/claude-logo.svg -resize 64x64 assets/claude-logo.png
convert assets/junie-logo.svg -resize 64x64 assets/junie-logo.png
```

Alternatively, download official logos:

- Claude: Get from [Anthropic Brand Assets](https://www.anthropic.com/brand)
- JetBrains Junie: Get from [JetBrains Brand Assets](https://www.jetbrains.com/company/brand/)

4. Build the extension:

```bash
npm run build
```

5. Import into Raycast:

```bash
npm run dev
```

## Configuration

1. Open Raycast preferences (⌘,)
2. Navigate to Extensions → Agent Usage Tracker
3. Enter your API key(s):
   - **Anthropic API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
   - **JetBrains Automation Token**: Get from your JetBrains IDE Services instance
   - **JetBrains Server URL**: Your IDE Services URL (default: https://ide-services.jetbrains.com)

## Usage

1. Open Raycast (⌘Space)
2. Type "View Agent Usage"
3. See your current usage across all configured agents
4. Press ⌘R to refresh the data

### Understanding the Display

Each agent shows:

- **Name**: The agent/service name
- **Model**: Current model in use (e.g., claude-sonnet-4-5)
- **Usage %**: Percentage of your limit used (color-coded)
- **Tokens**: Current usage / Total limit

#### Color Indicators

- 🟢 Green: 0-49% (Safe)
- 🟡 Yellow: 50-74% (Moderate)
- 🟠 Orange: 75-89% (High)
- 🔴 Red: 90-100% (Critical)

## API Information

### Anthropic API

The extension uses the Anthropic API to fetch usage data. You'll need:

- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
- Appropriate permissions to access organization usage data

**Note**: Usage tracking requires organization-level API access. Personal API keys may have limited access to usage statistics.

### JetBrains IDE Services API

The extension uses the JetBrains IDE Services AI Analytics API to track Junie usage. You'll need:

- A JetBrains IDE Services automation token
- Access to your organization's IDE Services instance
- The server URL (typically https://ide-services.jetbrains.com for cloud, or your self-hosted URL)

**API Endpoints Used:**

- `GET /api/analytics/ai/effectiveness/metrics` - Retrieves aggregated AI metrics including invocations, suggestions, and acceptances

**Authentication:**

- Bearer token authentication using automation tokens
- Create tokens in IDE Services: Configuration → Automation Tokens

**Note**: This API is designed for JetBrains IDE Services enterprise users. Personal JetBrains AI accounts can track usage through the IDE widget but don't have direct API access.

**Learn More:**

- [JetBrains IDE Services Documentation](https://www.jetbrains.com/help/ide-services/)
- [AI Analytics API Guide](https://www.jetbrains.com/help/ide-services/ai-analytics-api.html)
- [JetBrains AI Assistant](https://www.jetbrains.com/ai/)

## Development

### Project Structure

```
silver-funicular/
├── assets/           # Icons and logos
├── src/
│   ├── clients/      # API clients for each agent
│   │   ├── claude.ts
│   │   └── jetbrains.ts
│   ├── types.ts      # TypeScript type definitions
│   └── view-usage.tsx # Main UI component
├── package.json
└── tsconfig.json
```

### Adding New Agents

To add support for a new agent:

1. Create a new client in `src/clients/`:

```typescript
// src/clients/your-agent.ts
import { AgentUsage } from "../types";

export async function getYourAgentUsage(): Promise<AgentUsage> {
  // Fetch usage data from your agent's API
  return {
    name: "Your Agent",
    model: "model-name",
    usagePercentage: 50,
    currentUsage: 500000,
    limit: 1000000,
    logoPath: "your-agent-logo.png",
  };
}
```

2. Add the API key preference in `package.json`:

```json
{
  "name": "yourAgentApiKey",
  "type": "password",
  "required": false,
  "title": "Your Agent API Key",
  "description": "API key for Your Agent",
  "placeholder": "ya-..."
}
```

3. Update `view-usage.tsx` to fetch from your new client:

```typescript
if (preferences.yourAgentApiKey) {
  const usage = await getYourAgentUsage();
  results.push(usage);
}
```

4. Add the logo to `assets/your-agent-logo.png`

## Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run build` - Build the extension for production
- `npm run lint` - Run ESLint
- `npm run fix-lint` - Fix ESLint issues automatically
- `npm run publish` - Publish to Raycast store (requires approval)

## Troubleshooting

### "API key not configured" error

- Ensure you've added your API key in Raycast preferences
- Check that the key is valid and hasn't expired

### "Usage data not available" error

- Verify your API key has organization-level permissions
- Some API keys may not have access to usage statistics
- Check the Anthropic console for your account type

### Extension not appearing in Raycast

- Ensure you've run `npm run dev`
- Try restarting Raycast
- Check the Raycast console for errors (⌘⇧,)

## Privacy & Security

- API keys are stored securely in Raycast's encrypted preferences
- No data is sent to third parties
- All API calls are made directly from your machine to the agent providers

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing issues for similar problems

## Roadmap

- [ ] Add OpenAI GPT support
- [ ] Add Google Gemini support
- [ ] Add usage history charts
- [ ] Add usage alerts/notifications
- [ ] Export usage data to CSV
- [ ] Add cost estimates based on usage

## Acknowledgments

- Built with [Raycast API](https://developers.raycast.com/)
- Icons created for demonstration purposes
- Inspired by the need to track multiple AI agent subscriptions
