import { INDUSTRY_PROFILES } from './constants';

export async function extractTextFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
      page.cleanup();
    } catch (err) {
      console.warn('Failed to read page ' + i);
    }
  }
  return fullText;
}

export function detectIndustry(text) {
  const lowerText = text.toLowerCase();
  let bestMatch = 'default';
  let bestScore = 0;
  Object.keys(INDUSTRY_PROFILES).forEach((key) => {
    if (key === 'default') return;
    const profile = INDUSTRY_PROFILES[key];
    let score = 0;
    profile.keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = lowerText.match(regex);
      if (matches) score += matches.length;
    });
    if (score > bestScore) { bestScore = score; bestMatch = key; }
  });
  return bestMatch;
}

export function extractFinancials(text) {
  const normalized = text.replace(/\s+/g, ' ');
  const result = { revenue: null, cogs: null, rd: null, sga: null, deliveries: null };

  // Detect year column order
  let yearOrder = 'desc';
  const yearHeaderRegex = /(?:year\s+ended|fiscal\s+year|for\s+the\s+year)[^0-9]*?(20\d{2})\s+(?:.*?)(20\d{2})\s+(?:.*?)(20\d{2})/i;
  const ym = normalized.match(yearHeaderRegex);
  if (ym) {
    const y1 = parseInt(ym[1]);
    const y3 = parseInt(ym[3]);
    yearOrder = y1 > y3 ? 'desc' : 'asc';
    console.log('Year order detected: ' + ym[1] + ', ' + ym[2] + ', ' + ym[3] + ' → ' + yearOrder);
  } else {
    const simpleYearRegex = /(20\d{2})\s+(20\d{2})\s+(20\d{2})/g;
    let sym;
    while ((sym = simpleYearRegex.exec(normalized)) !== null) {
      const sy1 = parseInt(sym[1]), sy2 = parseInt(sym[2]), sy3 = parseInt(sym[3]);
      if (Math.abs(sy1 - sy2) === 1 && Math.abs(sy2 - sy3) === 1) {
        yearOrder = sy1 > sy3 ? 'desc' : 'asc';
        console.log('Year order detected (simple): ' + sym[1] + ', ' + sym[2] + ', ' + sym[3] + ' → ' + yearOrder);
        break;
      }
    }
  }

  function extractRowNumbers(patterns) {
    for (let i = 0; i < patterns.length; i++) {
      const regex = new RegExp(patterns[i] + '(?:\\s*\\([^)]*\\))?([^A-Za-z]{0,120})', 'gi');
      let m;
      while ((m = regex.exec(normalized)) !== null) {
        const afterText = m[1];
        const numRegex = /\(?\s*\$?\s*(\d[\d,]{2,})\s*\)?/g;
        const nums = [];
        let nm;
        while ((nm = numRegex.exec(afterText)) !== null) {
          const numStr = nm[1].replace(/,/g, '');
          const num = parseFloat(numStr);
          if (num >= 10) nums.push({ value: num, negative: nm[0].trim().charAt(0) === '(' });
        }
        if (nums.length >= 2) return nums;
      }
    }
    return null;
  }

  function getMostRecent(nums) {
    if (!nums || nums.length === 0) return null;
    if (yearOrder === 'desc') return nums[0].value;
    const idx = Math.min(nums.length, 3) - 1;
    return nums[idx].value;
  }

  function getAllYears(nums) {
    if (!nums || nums.length < 2) return null;
    const yearNums = nums.slice(0, Math.min(nums.length, 3));
    const values = yearNums.map((n) => n.value);
    if (yearOrder === 'desc') values.reverse();
    return values;
  }

  function findAmount(label, patterns) {
    const nums = extractRowNumbers(patterns);
    const val = getMostRecent(nums);
    if (val !== null) {
      console.log('Found ' + label + ': ' + val + ' (col order: ' + yearOrder +
        ', values: ' + nums.map((n) => n.value).join(', ') + ')');
    }
    return val;
  }

  result.revenue = findAmount('Revenue', [
    'total\\s+revenues(?:\\s*\\(Note\\s*\\d+\\))?',
    'total\\s+net\\s+revenues', 'net\\s+revenues'
  ]);
  result.cogs = findAmount('COGS', [
    'total\\s+cost\\s+of\\s+revenues(?:\\s*\\(Note\\s*\\d+\\))?',
    'total\\s+cost\\s+of\\s+revenue', 'cost\\s+of\\s+goods\\s+sold', 'cost\\s+of\\s+sales'
  ]);
  result.rd = findAmount('R&D', [
    'research\\s+and\\s+development(?:\\s*\\(Note\\s*\\d+\\))?'
  ]);
  result.sga = findAmount('SG&A', [
    'selling[,]?\\s+general[,]?\\s+and\\s+administrative(?:\\s*\\(Note\\s*\\d+\\))?',
    'selling[,]?\\s+general\\s+&\\s+administrative'
  ]);
  result.deliveries = findAmount('Deliveries', ['delivery\\s+volume']);

  // High-Low Method
  const revenueNums = extractRowNumbers([
    'total\\s+revenues(?:\\s*\\(Note\\s*\\d+\\))?',
    'total\\s+net\\s+revenues', 'net\\s+revenues'
  ]);
  const cogsNums = extractRowNumbers([
    'total\\s+cost\\s+of\\s+revenues(?:\\s*\\(Note\\s*\\d+\\))?',
    'total\\s+cost\\s+of\\s+revenue', 'cost\\s+of\\s+goods\\s+sold', 'cost\\s+of\\s+sales'
  ]);
  const rdNums = extractRowNumbers([
    'research\\s+and\\s+development(?:\\s*\\(Note\\s*\\d+\\))?'
  ]);
  const sgaNums = extractRowNumbers([
    'selling[,]?\\s+general[,]?\\s+and\\s+administrative(?:\\s*\\(Note\\s*\\d+\\))?',
    'selling[,]?\\s+general\\s+&\\s+administrative'
  ]);

  const revYears = getAllYears(revenueNums);
  const cogsYears = getAllYears(cogsNums);
  const rdYears = getAllYears(rdNums);
  const sgaYears = getAllYears(sgaNums);

  result.estimatedSplits = null;

  if (revYears && revYears.length >= 2) {
    let highIdx = 0, lowIdx = 0;
    for (let ri = 1; ri < revYears.length; ri++) {
      if (revYears[ri] > revYears[highIdx]) highIdx = ri;
      if (revYears[ri] < revYears[lowIdx]) lowIdx = ri;
    }

    if (highIdx !== lowIdx && revYears[highIdx] !== revYears[lowIdx]) {
      const revDiff = revYears[highIdx] - revYears[lowIdx];
      result.estimatedSplits = {};

      function estimateFixedPct(costYears, label) {
        if (!costYears || costYears.length < 2) return null;
        const costHigh = costYears[highIdx];
        const costLow = costYears[lowIdx];
        const variableRate = (costHigh - costLow) / revDiff;
        const mostRecentCost = costYears[costYears.length - 1];
        const mostRecentRev = revYears[revYears.length - 1];
        const variablePortion = variableRate * mostRecentRev;
        const fixedPortion = mostRecentCost - variablePortion;
        let fixedPct = Math.round((fixedPortion / mostRecentCost) * 100);
        fixedPct = Math.max(0, Math.min(100, fixedPct));
        console.log('High-Low estimate ' + label + ': fixed=' + fixedPct + '% (variableRate=' + variableRate.toFixed(3) +
          ', costs=[' + costYears.join(',') + '], revs=[' + revYears.join(',') + '])');
        return fixedPct;
      }

      result.estimatedSplits.cogsFix = estimateFixedPct(cogsYears, 'COGS');
      result.estimatedSplits.rdFix = estimateFixedPct(rdYears, 'R&D');
      result.estimatedSplits.sgaFix = estimateFixedPct(sgaYears, 'SG&A');
    }
  }

  // Narrative delivery volume
  if (result.deliveries === null) {
    const deliveryPatterns = [
      /delivered\s+approximately\s+([\d.]+)\s+million\s+(?:consumer\s+)?vehicles/i,
      /approximately\s+([\d.]+)\s+million\s+(?:consumer\s+)?vehicle\s+deliveries/i,
      /total\s+deliveries\s+(?:of\s+)?approximately\s+([\d.]+)\s+million/i,
      /delivered\s+([\d,]+)\s+vehicles/i
    ];
    for (let dp = 0; dp < deliveryPatterns.length; dp++) {
      const dm = normalized.match(deliveryPatterns[dp]);
      if (dm) {
        let dval = parseFloat(dm[1].replace(/,/g, ''));
        if (dval < 100) dval = Math.round(dval * 1000000);
        result.deliveries = dval;
        console.log('Found Deliveries (narrative): ' + dval);
        break;
      }
    }
  }

  return result;
}

export function toMillions(value) {
  if (value > 1000000) return Math.round(value / 1000);
  return Math.round(value);
}

export function extractCompanyName(text, filename) {
  const registrantMatch = text.match(/([A-Z][A-Za-z\s,.&']+(?:Inc\.|Corp\.|Ltd\.|Co\.|LLC|LP|N\.V\.))\s*\(?\s*(?:Exact name|exact name)/i);
  if (registrantMatch) {
    let name = registrantMatch[1].trim();
    name = name.replace(/[,.]?\s*(Inc|Corp|Ltd|Co|LLC|LP|N\.V)\.*$/i, '').trim();
    if (name.length > 2 && name.length <= 40) return name;
  }

  let fname = filename.replace(/\.pdf$/i, '');
  fname = fname.replace(/_-_Form.*$/i, '');
  fname = fname.replace(/[-_](Inc|Corp|Ltd)$/i, '');
  fname = fname.replace(/[-_]\d{8}.*$/i, '');
  fname = fname.replace(/[_-]/g, ' ').trim();
  if (fname.length > 30) fname = fname.substring(0, 30);
  return fname || 'Company';
}
