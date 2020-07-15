module.exports = {
  '**/*.less': 'stylelint --syntax less',
  '**/*.{js,jsx,ts,tsx}': 'eslint --ext .js,.jsx,.ts,.tsx',
  '**/*.{js,jsx,tsx,ts,less,md,json}': ['prettier --write'],
};