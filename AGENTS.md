# AGENTS.md

## Purpose
This file defines working rules for AI agents operating in this repository.

## Development Workflow
For each change/requirement:
1. Update SPEC.md with the new requirement
2. Modify the code
3. Test locally (open in browser or use local server)
4. Fix any bugs
5. Bump version number in:
   - index.html (title): `<title>...V0.0.X</title>`
   - index.html (version display): `<span class="text-[9px]">v0.0.X</span>`
6. Update SPEC.md version
7. Commit with message: "v0.0.X - description"
8. Push to origin main

### Version Bumping
```bash
# Update version in files:
# 1. index.html title: V0.0.X
# 2. index.html version span: v0.0.X  
# 3. SPEC.md: - **Version**: 0.0.X

# Commit:
git add . && git commit -m "v0.0.X - description" && git push origin main
```

## Project Overview
- **Type**: Single-page 3D solar system visualization
- **Tech Stack**: HTML5, Three.js, Tailwind CSS, GLSL shaders
- **Phase**: V0 (interactive prototype with AI features via Gemini API)

## Build & Development Commands

### Running the Project
```bash
# Simply open index.html in a browser, or use a local server:
npx serve .
# or
python3 -m http.server 8000
```

### Linting
- This project uses embedded JavaScript (no build step)
- For code quality, use ESLint with browser environment:
  ```bash
  npx eslint index.html --ext .html,.js
  ```
- Or manually validate JS syntax

### Testing
- No formal test framework is configured
- Manual testing via browser verification:
  - Open index.html in browser
  - Verify 3D rendering loads correctly
  - Test planet interactions (hover, click)
  - Test AI scan functionality with API key
  - Test time controls and view options

### Single Test Execution
Since there are no automated tests, manual verification is required for each change.

## Code Style Guidelines

### General Principles
- Prefer readability over cleverness
- Keep functions focused and small
- Use descriptive variable and function names
- Avoid deep nesting (max 3-4 levels)

### HTML Structure
- Use semantic HTML5 elements
- Keep inline styles minimal; use CSS classes
- Group related styles in `<style>` blocks
- Use Tailwind utility classes for rapid UI development

### JavaScript Conventions
- Use ES6+ features (const/let, arrow functions, template literals)
- Declare variables at the top of their scope
- Use meaningful names: `celestialData`, `createPlanets`, `generatePlanetTexture`
- Avoid magic numbers; use named constants
- Use JSDoc comments for public functions

### Three.js Specific
- Follow Three.js naming conventions (Scene, Camera, Renderer)
- Dispose of geometries and materials when removing objects
- Use requestAnimationFrame for animation loops
- Handle window resize properly

### GLSL Shaders
- Use descriptive variable names in shaders
- Comment complex math operations
- Keep vertex and fragment shaders balanced

### Naming Conventions
- **Variables**: camelCase (`timeCount`, `hoveredObject`)
- **Constants**: UPPER_SNAKE_CASE where appropriate
- **Functions**: camelCase, verb-prefixed (`createSun`, `jumpTo`, `generatePlanetTexture`)
- **CSS Classes**: kebab-case with semantic prefixes (`glass-panel`, `btn-sci`)

### Error Handling
- Wrap async operations (API calls) in try/catch
- Provide user feedback on failures
- Log errors to console for debugging
- Example pattern:
  ```javascript
  try {
    // operation
  } catch(e) {
    uiElements.aiStatus.innerText = "Error: Signal lost. Verify your API Key.";
  }
  ```

### Imports & Dependencies
- Use CDN links for Three.js and Tailwind (current approach)
- If adding dependencies, prefer minimal additions
- Document any new external resources

## UI/UX Guidelines

### Visual Design
- Maintain neon sci-fi aesthetic with cyan/purple accents
- Use glassmorphism panels with backdrop blur
- Keep UI panels properly positioned and z-indexed
- Ensure responsive behavior for different screen sizes

### User Interactions
- Provide hover states for all interactive elements
- Show loading states during async operations
- Display tooltips for celestial objects
- Handle edge cases (no selection, missing API key)

## Collaboration Rules
- Keep changes small and reversible
- Test changes in browser before marking complete
- Update documentation if adding new features
- Never commit API keys or secrets

## Git Practices
- Make meaningful commits with clear messages
- Avoid destructive git commands
- Keep working directory clean before starting new tasks

## API Key Management
- Never hardcode API keys in source code
- Use input fields for user-provided keys (current pattern in `apiKeyInput`)
- Consider localStorage only for convenience, never as primary storage
- Display clear UI feedback when API key is missing or invalid

## Performance Guidelines
- Use efficient geometry (avoid excessive vertices in SphereGeometry)
- Limit number of draw calls by reusing materials
- Use BufferGeometry for star fields (current approach in `createStars`)
- Throttle mouse move events if raycasting becomes expensive
- Consider Level of Detail (LOD) for distant objects if needed

## Animation Best Practices
- Use requestAnimationFrame for the render loop (current pattern)
- Delta time should drive animations for consistent speed across frame rates
- Avoid creating new objects in the animation loop; reuse vectors
- Clean up animation callbacks when objects are removed

## Future Considerations
As the project grows, consider:
- Adding a build system (Vite/Webpack) for better JS organization
- Splitting into multiple files (utils, shaders, etc.)
- Adding unit tests with Jest or Vitest
- Adding E2E tests with Playwright
- Implementing proper state management
- Adding keyboard shortcuts for navigation
- Supporting mobile touch controls
- Adding more celestial objects (moons, asteroids, comets)
