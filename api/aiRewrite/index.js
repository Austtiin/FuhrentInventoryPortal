module.exports = async function (context, req) {
  const start = Date.now();
  const receivedAt = new Date().toISOString();

  try {
    if (req.method !== 'POST') {
      context.res = {
        status: 405,
        headers: { 'Allow': 'POST' },
        body: { success: false, error: 'Method Not Allowed' }
      };
      return;
    }

    const body = typeof req.body === 'object' ? req.body : {};
    const description = typeof body.description === 'string' ? body.description : '';
    const previewOnly = !!body.previewOnly;

    if (!description.trim()) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          status: 'error',
          error: { message: 'Missing required field: description' },
          stages: [ { name: 'received', at: receivedAt } ],
          meta: { maxWords: 120 }
        }
      };
      return;
    }

    const MAX_WORDS = 120;

    // If previewOnly, return the built prompt (no AI call)
    if (previewOnly) {
      const promptBuilt = [
        'Vehicle Description:',
        'Description:',
        description.trim()
      ].join('\n');

      const loadingAt = new Date().toISOString();
      const completeAt = new Date().toISOString();
      const duration = Date.now() - start;
      context.log(`✅ AI Rewrite prompt built in ${duration}ms (previewOnly=true)`);
      context.res = {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: {
          status: 'complete',
          stages: [
            { name: 'received', at: receivedAt },
            { name: 'loading', at: loadingAt },
            { name: 'complete', at: completeAt }
          ],
          promptBuilt,
          meta: { maxWords: MAX_WORDS },
          duration: `${duration}ms`
        }
      };
      return;
    }

    // Non-preview path: perform a deterministic local rewrite (no AI)
    const normalizeWhitespace = (s) => s.replace(/\s+/g, ' ').replace(/\s,\s/g, ', ').trim();
    const splitSentences = (s) => {
      const parts = s
        .replace(/([.!?])+/g, '$1|')
        .split('|')
        .map(p => p.trim())
        .filter(Boolean);
      if (parts.length === 0) return [s.trim()];
      return parts;
    };
    const capitalizeSentence = (s) => s ? (s.charAt(0).toUpperCase() + s.slice(1)) : s;
    const limitWords = (s, max) => {
      const words = s.split(/\s+/).filter(Boolean);
      if (words.length <= max) return s;
      return words.slice(0, max).join(' ') + '…';
    };

    const cleaned = normalizeWhitespace(description);
    const sentences = splitSentences(cleaned).map(capitalizeSentence);
    let rewritten = sentences.join('. ');
    if (!/[.!?]$/.test(rewritten)) rewritten += '.';
    rewritten = limitWords(rewritten, MAX_WORDS);

    const header = 'Vehicle Description:';
    const revisedText = `${header} ${rewritten}`;

    const duration = Date.now() - start;
    context.log(`✅ AI Rewrite generated in ${duration}ms (previewOnly=${previewOnly})`);

    const loadingAt = new Date().toISOString();
    const completeAt = new Date().toISOString();
    const response = {
      status: 'complete',
      stages: [
        { name: 'received', at: receivedAt },
        { name: 'loading', at: loadingAt },
        { name: 'complete', at: completeAt }
      ],
      rewrittenText: revisedText,
      meta: { maxWords: MAX_WORDS },
      duration: `${duration}ms`
    };

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: response
    };
  } catch (err) {
    const duration = Date.now() - start;
    context.log.error('❌ AI Rewrite error:', err);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        status: 'error',
        error: { message: err.message || 'Internal error' },
        stages: [ { name: 'received', at: receivedAt } ],
        duration: `${duration}ms`
      }
    };
  }
};
