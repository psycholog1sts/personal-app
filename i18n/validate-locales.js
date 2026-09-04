function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function placeholders(value) {
  if (typeof value !== 'string') return [];
  return [...value.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();
}

function pushError(errors, path, message) {
  errors.push(`${path || '<root>'}: ${message}`);
}

function walk(source, candidate, path, errors) {
  const sourceType = valueType(source);
  const candidateType = valueType(candidate);

  if (sourceType !== candidateType) {
    pushError(errors, path, `type mismatch; expected ${sourceType}, received ${candidateType}`);
    return;
  }

  if (sourceType === 'string') {
    if (candidate.trim().length === 0) pushError(errors, path, 'empty localized string');
    const expected = placeholders(source);
    const actual = placeholders(candidate);
    if (expected.join('|') !== actual.join('|')) {
      pushError(errors, path, `placeholder mismatch; expected {${expected.join(',')}} received {${actual.join(',')}}`);
    }
    return;
  }

  if (sourceType === 'array') {
    if (source.length !== candidate.length) {
      pushError(errors, path, `array length mismatch; expected ${source.length}, received ${candidate.length}`);
    }
    const length = Math.min(source.length, candidate.length);
    for (let index = 0; index < length; index += 1) {
      const sourceItem = source[index];
      const candidateItem = candidate[index];
      if (
        sourceItem && candidateItem &&
        valueType(sourceItem) === 'object' && valueType(candidateItem) === 'object' &&
        typeof sourceItem.id === 'string' && sourceItem.id !== candidateItem.id
      ) {
        pushError(errors, `${path}[${index}].id`, `stable id mismatch; expected ${sourceItem.id}, received ${candidateItem.id}`);
      }
      walk(sourceItem, candidateItem, `${path}[${index}]`, errors);
    }
    return;
  }

  if (sourceType === 'object') {
    const sourceKeys = Object.keys(source);
    const candidateKeys = Object.keys(candidate);

    for (const key of sourceKeys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!Object.prototype.hasOwnProperty.call(candidate, key)) {
        pushError(errors, childPath, 'missing key');
        continue;
      }
      walk(source[key], candidate[key], childPath, errors);
    }

    for (const key of candidateKeys) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        const childPath = path ? `${path}.${key}` : key;
        pushError(errors, childPath, 'unexpected key');
      }
    }
  }
}

export function validateDictionary(source, candidate) {
  const errors = [];
  walk(source, candidate, '', errors);
  return { ok: errors.length === 0, errors };
}

export function validateLocaleRegistry(registry, defaultLocale) {
  const errors = [];
  if (!Array.isArray(registry) || registry.length === 0) {
    return { ok: false, errors: ['registry: must contain at least one locale'] };
  }

  const requiredFields = ['code', 'slug', 'status', 'htmlLang', 'ogLocale', 'label', 'dir'];
  const codes = new Set();
  const slugs = new Set();

  registry.forEach((locale, index) => {
    const path = `registry[${index}]`;
    for (const field of requiredFields) {
      if (typeof locale?.[field] !== 'string') {
        errors.push(`${path}.${field}: must be a string`);
      } else if (field !== 'slug' && locale[field].trim().length === 0) {
        errors.push(`${path}.${field}: must not be empty`);
      }
    }

    if (!['published', 'draft'].includes(locale?.status)) errors.push(`${path}.status: must be published or draft`);
    if (!['ltr', 'rtl'].includes(locale?.dir)) errors.push(`${path}.dir: must be ltr or rtl`);

    if (typeof locale?.code === 'string') {
      if (codes.has(locale.code)) errors.push(`${path}.code: duplicate locale code ${locale.code}`);
      codes.add(locale.code);
    }
    if (typeof locale?.slug === 'string') {
      if (slugs.has(locale.slug)) errors.push(`${path}.slug: duplicate locale slug ${locale.slug}`);
      slugs.add(locale.slug);
      if (locale.code !== defaultLocale && locale.slug.trim().length === 0) errors.push(`${path}.slug: non-default locale requires a URL slug`);
    }
  });

  const sourceLocale = registry.find((locale) => locale.code === defaultLocale);
  if (!sourceLocale) errors.push(`registry: default locale ${defaultLocale} is missing`);
  else if (sourceLocale.status !== 'published') errors.push(`registry: default locale ${defaultLocale} must be published`);
  else if (sourceLocale.slug !== '') errors.push(`registry: default locale ${defaultLocale} must use the root URL with an empty slug`);

  return { ok: errors.length === 0, errors };
}
