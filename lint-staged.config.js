module.exports = {
  '**/*.less': 'stylelint --syntax less',
  '**/*.{js,jsx,ts,tsx}': ['eslint --ext .js,.jsx,.ts,.tsx', 'npm run type-check'],
  '**/*.{js,jsx,tsx,ts,less,md,json}': ['prettier --write'],
};
