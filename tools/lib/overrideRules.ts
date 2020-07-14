function overrideRules(rules: any, patch: any) {
  return rules.map((ruleToPatch: any) => {
    let rule = patch(ruleToPatch);
    if (rule.rules) {
      rule = { ...rule, rules: overrideRules(rule.rules, patch) };
    }
    if (rule.oneOf) {
      rule = { ...rule, oneOf: overrideRules(rule.oneOf, patch) };
    }
    return rule;
  });
}

export default overrideRules;
