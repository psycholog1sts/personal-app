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
