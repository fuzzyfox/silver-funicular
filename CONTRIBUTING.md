# Contributing to Agent Usage Tracker

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start development mode: `npm run dev`
4. Make your changes
5. Test thoroughly in Raycast
6. Submit a pull request

## Code Style

- Use TypeScript for all new code
- Follow the existing code structure
- Use Prettier for formatting (config included)
- Run `npm run lint` before committing
- Use descriptive variable and function names

## Adding New Agent Support

When adding a new agent, please:

1. Create a new client file in `src/clients/`
2. Follow the `AgentUsage` interface in `src/types.ts`
3. Add preference fields in `package.json`
4. Update `src/view-usage.tsx` to include the new agent
5. Add agent logo to `assets/`
6. Update README.md with the new agent information
7. Test with real API credentials

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Include clear description of changes
- Update documentation as needed
- Add tests if applicable
- Ensure all lint checks pass
- Test the extension in Raycast before submitting

## Code Review Process

1. Submit your PR with clear description
2. Address any review comments
3. Wait for approval from maintainers
4. Once approved, your PR will be merged

## Testing

Before submitting:

- [ ] Test the extension in Raycast
- [ ] Verify all API integrations work
- [ ] Check error handling
- [ ] Ensure preferences are properly saved
- [ ] Test with and without API keys configured
- [ ] Run `npm run lint` and fix any issues

## Questions?

Feel free to open an issue for any questions or clarifications needed.
