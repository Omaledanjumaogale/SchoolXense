/**
 * Seed question bank — one tagged bank for secondary, campus, pro and skills.
 * Each item carries exam, subject, topic, IRT (a = discrimination, b = difficulty),
 * Bloom level, author and review status. In production these live in Convex
 * `questions` / `questionVersions` and are served lookup-first.
 */
export interface Question {
	id: string;
	exam: string;
	subject: string;
	topic: string;
	stem: string;
	options: string[];
	answer: number;
	explanation: string;
	a: number;
	b: number;
	bloom: 'remember' | 'understand' | 'apply' | 'analyse';
	status: 'reviewed' | 'unreviewed';
	authorId: string;
	servedCount: number;
}

type Row = [exam: string, subject: string, topic: string, stem: string, options: string[], answer: number, explanation: string, b: number, bloom?: Question['bloom']];

const ROWS: Row[] = [
	// ── JAMB/WAEC Physics ────────────────────────────────────────────
	['jamb', 'physics', 'Waves', 'A wave of frequency 50 Hz travels at 340 m/s. Its wavelength is', ['0.15 m', '6.8 m', '17,000 m', '0.68 m'], 1, 'v = fλ, so λ = v/f = 340/50 = 6.8 m.', -0.6, 'apply'],
	['jamb', 'physics', 'Waves', 'Which of these is a longitudinal wave?', ['Light', 'Radio', 'Sound in air', 'Ripples on water'], 2, 'In sound, particles vibrate parallel to the direction of travel — compressions and rarefactions.', -1.2, 'remember'],
	['jamb', 'physics', 'Waves', 'The period of a wave of frequency 25 Hz is', ['0.04 s', '0.4 s', '2.5 s', '25 s'], 0, 'T = 1/f = 1/25 = 0.04 s.', -1.0, 'apply'],
	['jamb', 'physics', 'Waves', 'Beats are heard when two sources have', ['Equal amplitudes only', 'Slightly different frequencies', 'Same frequency and phase', 'Very different wavelengths'], 1, 'Beat frequency = |f₁ − f₂|, audible when the difference is small.', 0.4, 'understand'],
	['jamb', 'physics', 'Optics', 'An object is placed 20 cm in front of a converging lens of focal length 10 cm. The image distance is', ['10 cm', '20 cm', '30 cm', '40 cm'], 1, '1/f = 1/u + 1/v → 1/10 = 1/20 + 1/v → v = 20 cm (object at 2F gives image at 2F).', 0.3, 'apply'],
	['jamb', 'physics', 'Optics', 'The critical angle of glass of refractive index 1.5 is closest to', ['30°', '42°', '48°', '60°'], 1, 'sin C = 1/n = 0.667 → C ≈ 41.8°.', 0.8, 'apply'],
	['jamb', 'physics', 'Optics', 'The image formed by a plane mirror is', ['Real and inverted', 'Virtual and laterally inverted', 'Real and magnified', 'Virtual and diminished'], 1, 'Plane mirrors form virtual, upright, same-size, laterally inverted images.', -1.4, 'remember'],
	['jamb', 'physics', 'Optics', 'Dispersion of white light by a prism occurs because', ['Light travels in straight lines', 'Different colours have different refractive indices', 'The prism absorbs some colours', 'Light is a transverse wave'], 1, 'Refractive index depends on wavelength, so each colour bends by a different amount.', 0.1, 'understand'],
	['jamb', 'physics', 'Mechanics', 'A car accelerates uniformly from rest to 20 m/s in 5 s. Its acceleration is', ['2 m/s²', '4 m/s²', '5 m/s²', '100 m/s²'], 1, 'a = (v − u)/t = 20/5 = 4 m/s².', -0.9, 'apply'],
	['jamb', 'physics', 'Mechanics', 'The SI unit of momentum is', ['kg m/s', 'N/m', 'kg m/s²', 'J s'], 0, 'p = mv, so units are kg·m/s (equivalently N·s).', -1.3, 'remember'],
	['jamb', 'physics', 'Mechanics', 'A 2 kg mass is lifted 5 m. Taking g = 10 m/s², the work done is', ['10 J', '50 J', '100 J', '25 J'], 2, 'W = mgh = 2 × 10 × 5 = 100 J.', -0.7, 'apply'],
	['jamb', 'physics', 'Electricity', 'Three 6 Ω resistors in parallel have an equivalent resistance of', ['18 Ω', '6 Ω', '3 Ω', '2 Ω'], 3, '1/R = 3 × (1/6) = 1/2 → R = 2 Ω.', 0.0, 'apply'],
	['jamb', 'physics', 'Electricity', 'The power dissipated when 2 A flows through 10 Ω is', ['5 W', '20 W', '40 W', '200 W'], 2, 'P = I²R = 4 × 10 = 40 W.', 0.2, 'apply'],
	['jamb', 'physics', 'Heat', 'The quantity of heat needed to raise 1 kg of a substance by 1 K is its', ['Heat capacity', 'Specific heat capacity', 'Latent heat', 'Thermal conductivity'], 1, 'Specific heat capacity c is per unit mass per kelvin (J kg⁻¹ K⁻¹).', -1.1, 'remember'],
	['jamb', 'physics', 'Heat', 'Land breezes blow at night because the land', ['Cools faster than the sea', 'Heats faster than the sea', 'Has higher specific heat', 'Absorbs more moisture'], 0, 'Land has lower specific heat; at night it cools faster, so air over the sea rises and air flows from land to sea.', 0.5, 'understand'],
	// ── Chemistry ────────────────────────────────────────────────────
	['jamb', 'chemistry', 'Mole concept', 'How many moles are in 22 g of CO₂? (C = 12, O = 16)', ['0.25', '0.5', '1.0', '2.0'], 1, 'Molar mass CO₂ = 44 g/mol; n = 22/44 = 0.5 mol.', -0.5, 'apply'],
	['jamb', 'chemistry', 'Mole concept', 'The number of particles in one mole is', ['6.02 × 10²³', '6.02 × 10²²', '3.01 × 10²³', '1.66 × 10⁻²⁴'], 0, "Avogadro's constant: 6.02 × 10²³ mol⁻¹.", -1.5, 'remember'],
	['jamb', 'chemistry', 'Mole concept', 'What volume does 2 mol of a gas occupy at s.t.p.?', ['11.2 dm³', '22.4 dm³', '44.8 dm³', '24.0 dm³'], 2, 'Molar volume at s.t.p. = 22.4 dm³; 2 × 22.4 = 44.8 dm³.', -0.2, 'apply'],
	['jamb', 'chemistry', 'Organic chemistry', 'The general formula of the alkanes is', ['CₙH₂ₙ', 'CₙH₂ₙ₊₂', 'CₙH₂ₙ₋₂', 'CₙH₂ₙ₊₁OH'], 1, 'Alkanes are saturated: CₙH₂ₙ₊₂.', -0.8, 'remember'],
	['jamb', 'chemistry', 'Organic chemistry', 'Ethene decolourises bromine water because it', ['Is saturated', 'Undergoes addition', 'Is an alcohol', 'Undergoes substitution only'], 1, 'The C=C double bond undergoes addition with Br₂.', 0.2, 'understand'],
	['jamb', 'chemistry', 'Organic chemistry', 'The functional group of alkanoic acids is', ['–OH', '–COOH', '–CHO', '–NH₂'], 1, 'Carboxyl group –COOH.', -0.9, 'remember'],
	['jamb', 'chemistry', 'Periodic table', 'Elements in the same group have the same', ['Atomic mass', 'Number of shells', 'Number of valence electrons', 'Number of neutrons'], 2, 'Group number reflects valence electrons, which drive similar chemistry.', -1.0, 'understand'],
	['jamb', 'chemistry', 'Periodic table', 'Across a period from left to right, atomic radius generally', ['Increases', 'Decreases', 'Stays constant', 'Doubles'], 1, 'Increasing nuclear charge pulls electrons closer.', 0.1, 'understand'],
	['jamb', 'chemistry', 'Acids & bases', 'A solution with pH 3 is', ['Strongly alkaline', 'Neutral', 'Acidic', 'Weakly alkaline'], 2, 'pH < 7 is acidic.', -1.6, 'remember'],
	['jamb', 'chemistry', 'Acids & bases', 'The salt formed when HCl reacts with NaOH is', ['NaCl', 'NaClO', 'Na₂O', 'HClO'], 0, 'HCl + NaOH → NaCl + H₂O.', -1.2, 'apply'],
	// ── Mathematics ──────────────────────────────────────────────────
	['jamb', 'mathematics', 'Algebra', 'Solve for x: 3x − 7 = 11', ['4', '6', '18/3', '−6'], 1, '3x = 18 → x = 6.', -1.5, 'apply'],
	['jamb', 'mathematics', 'Algebra', 'The roots of x² − 5x + 6 = 0 are', ['2 and 3', '−2 and −3', '1 and 6', '−1 and 6'], 0, '(x − 2)(x − 3) = 0.', -0.6, 'apply'],
	['jamb', 'mathematics', 'Algebra', 'If 2x + y = 7 and x − y = 2, find x.', ['1', '2', '3', '5'], 2, 'Add the equations: 3x = 9 → x = 3.', -0.3, 'apply'],
	['jamb', 'mathematics', 'Indices & logs', 'Simplify 8^(2/3)', ['2', '4', '16/3', '64'], 1, '8^(1/3) = 2; 2² = 4.', -0.2, 'apply'],
	['jamb', 'mathematics', 'Indices & logs', 'Evaluate log₂ 32', ['4', '5', '6', '16'], 1, '2⁵ = 32.', -0.7, 'apply'],
	['jamb', 'mathematics', 'Indices & logs', 'Given log 2 = 0.3010, find log 8.', ['0.9030', '0.6020', '2.4080', '0.0903'], 0, 'log 8 = 3 log 2 = 0.9030.', 0.3, 'apply'],
	['jamb', 'mathematics', 'Statistics', 'The mean of 4, 7, 9, 10 and 15 is', ['8', '9', '10', '11'], 1, 'Sum 45 ÷ 5 = 9.', -1.3, 'apply'],
	['jamb', 'mathematics', 'Statistics', 'The median of 3, 8, 1, 9, 6, 4 is', ['5', '6', '4', '5.5'], 0, 'Sorted: 1,3,4,6,8,9 → (4 + 6)/2 = 5.', 0.2, 'apply'],
	['jamb', 'mathematics', 'Statistics', 'A die is thrown once. The probability of an even number is', ['1/6', '1/3', '1/2', '2/3'], 2, '3 even faces out of 6.', -1.2, 'apply'],
	['jamb', 'mathematics', 'Geometry', 'The sum of interior angles of a hexagon is', ['540°', '720°', '900°', '360°'], 1, '(n − 2) × 180 = 4 × 180 = 720°.', -0.4, 'apply'],
	['jamb', 'mathematics', 'Geometry', 'The area of a circle of radius 7 cm (π = 22/7) is', ['44 cm²', '154 cm²', '308 cm²', '49 cm²'], 1, 'πr² = 22/7 × 49 = 154 cm².', -0.8, 'apply'],
	// ── English ──────────────────────────────────────────────────────
	['jamb', 'english', 'Lexis', 'Choose the word nearest in meaning to "ubiquitous".', ['Rare', 'Everywhere', 'Ancient', 'Noisy'], 1, 'Ubiquitous means present everywhere.', 0.3, 'remember'],
	['jamb', 'english', 'Lexis', 'Choose the opposite of "frugal".', ['Thrifty', 'Wasteful', 'Careful', 'Poor'], 1, 'Frugal = economical; the opposite is wasteful/extravagant.', -0.2, 'remember'],
	['jamb', 'english', 'Comprehension', '"He let the cat out of the bag" means he', ['Freed an animal', 'Revealed a secret', 'Made a mistake', 'Lost something'], 1, 'An idiom for disclosing a secret.', -1.0, 'understand'],
	['jamb', 'english', 'Oral English', 'Which word has a different vowel sound? ', ['seat', 'meet', 'bit', 'feet'], 2, '"bit" has /ɪ/; the others have /iː/.', 0.4, 'understand'],
	// ── Biology ──────────────────────────────────────────────────────
	['jamb', 'biology', 'Cell biology', 'The powerhouse of the cell is the', ['Nucleus', 'Ribosome', 'Mitochondrion', 'Golgi body'], 2, 'Mitochondria carry out aerobic respiration, producing ATP.', -1.4, 'remember'],
	['jamb', 'biology', 'Genetics', 'A cross between Tt and Tt gives the ratio of tall to dwarf as', ['1:1', '3:1', '1:2:1', '9:3:3:1'], 1, 'TT, Tt, Tt are tall; tt is dwarf → 3:1.', -0.1, 'apply'],
	['jamb', 'biology', 'Ecology', 'Organisms that make their own food are called', ['Consumers', 'Decomposers', 'Producers', 'Parasites'], 2, 'Autotrophs (producers) photosynthesise.', -1.5, 'remember'],
	// ── WAEC Agric ───────────────────────────────────────────────────
	['waec', 'agric', 'Soil science', 'The soil type with the best water-holding capacity is', ['Sandy', 'Loamy', 'Clayey', 'Gravelly'], 2, 'Clay particles are fine and hold the most water (though drainage is poor). Loam balances both.', 0.2, 'understand'],
	['waec', 'agric', 'Crop production', 'Which practice reduces soil erosion on slopes?', ['Bush burning', 'Contour ploughing', 'Overgrazing', 'Monocropping'], 1, 'Ridges along contours slow run-off.', -0.6, 'understand'],
	['waec', 'agric', 'Animal husbandry', 'The gestation period of a sow is about', ['21 days', '114 days', '150 days', '280 days'], 1, '3 months, 3 weeks, 3 days ≈ 114 days.', 0.5, 'remember'],
	['waec', 'agric', 'Farm records', 'A record of all money received and spent on a farm is a', ['Inventory record', 'Cash book', 'Production record', 'Labour record'], 1, 'The cash book (receipts and payments) tracks money in and out.', -0.4, 'remember'],
	// ── Campus ───────────────────────────────────────────────────────
	['campus', 'mth101', 'Set theory', 'If A = {1,2,3} and B = {2,3,4}, then A ∩ B is', ['{1,4}', '{2,3}', '{1,2,3,4}', '∅'], 1, 'Intersection holds common elements.', -1.0, 'apply'],
	['campus', 'mth101', 'Set theory', 'A set with 4 elements has how many subsets?', ['4', '8', '16', '24'], 2, '2⁴ = 16.', -0.2, 'apply'],
	['campus', 'mth101', 'Indices & logarithms', 'Solve 2^(x+1) = 16', ['2', '3', '4', '5'], 1, '16 = 2⁴ → x + 1 = 4 → x = 3.', -0.3, 'apply'],
	['campus', 'mth101', 'Quadratic equations', 'The discriminant of 2x² + 3x − 2 = 0 is', ['25', '−7', '9', '17'], 0, 'b² − 4ac = 9 + 16 = 25.', 0.1, 'apply'],
	['campus', 'mth101', 'Quadratic equations', 'For x² − 6x + k = 0 to have equal roots, k =', ['6', '9', '−9', '36'], 1, 'b² = 4ac → 36 = 4k → k = 9.', 0.6, 'analyse'],
	['campus', 'csc101', 'History of computing', 'Who is credited with designing the Analytical Engine?', ['Alan Turing', 'Charles Babbage', 'John von Neumann', 'Blaise Pascal'], 1, 'Babbage designed it in the 1830s.', -0.8, 'remember'],
	['campus', 'csc101', 'Number systems', 'The binary number 1011 in decimal is', ['9', '10', '11', '13'], 2, '8 + 0 + 2 + 1 = 11.', -0.6, 'apply'],
	['campus', 'csc101', 'Number systems', 'The hexadecimal value of decimal 255 is', ['EF', 'FF', 'F0', '1FF'], 1, '255 = 15 × 16 + 15 → FF.', 0.3, 'apply'],
	['campus', 'csc101', 'Software types', 'An operating system is an example of', ['Application software', 'System software', 'Firmware only', 'Malware'], 1, 'OSs manage hardware and provide services to applications.', -1.2, 'remember'],
	['campus', 'eco101', 'Supply and demand', 'A rise in the price of a good, other things equal, causes', ['A rise in quantity demanded', 'A fall in quantity demanded', 'A shift of the demand curve', 'No change'], 1, 'Law of demand: movement along the curve.', -1.0, 'understand'],
	['campus', 'eco101', 'Elasticity', 'If a 10% price rise causes a 20% fall in quantity demanded, demand is', ['Inelastic', 'Unit elastic', 'Elastic', 'Perfectly inelastic'], 2, 'PED = 20/10 = 2 > 1 → elastic.', 0.2, 'analyse'],
	['campus', 'eco101', 'Market structures', 'A market with a single seller is', ['Oligopoly', 'Monopoly', 'Perfect competition', 'Monopsony'], 1, 'Monopoly = one seller; monopsony = one buyer.', -0.9, 'remember'],
	['campus', 'gst111', 'Grammar', 'Choose the correct sentence.', ['Each of the students have a book.', 'Each of the students has a book.', 'Each of the student have books.', 'Each students has a book.'], 1, '"Each" is singular, so it takes "has".', -0.3, 'apply'],
	// ── Pro ──────────────────────────────────────────────────────────
	['ican', 'financial-reporting', 'IFRS basics', 'Under IAS 16, an item of PPE is initially measured at', ['Fair value', 'Cost', 'Net realisable value', 'Replacement cost'], 1, 'IAS 16 requires initial measurement at cost.', 0.2, 'remember'],
	['ican', 'financial-reporting', 'Ratios', 'Current assets ₦600k, current liabilities ₦300k. The current ratio is', ['0.5:1', '1:1', '2:1', '3:1'], 2, '600 ÷ 300 = 2.', -0.6, 'apply'],
	['ican', 'financial-reporting', 'Consolidation', 'Goodwill arises when consideration paid exceeds', ['Share capital', 'Fair value of net assets acquired', 'Book value of liabilities', 'Retained earnings'], 1, 'IFRS 3 goodwill = consideration + NCI − FV of identifiable net assets.', 0.9, 'understand'],
	['ielts', 'reading', 'Vocabulary', 'Choose the best synonym for "mitigate".', ['Worsen', 'Lessen', 'Ignore', 'Measure'], 1, 'To mitigate is to make less severe.', 0.0, 'remember'],
	['ielts', 'reading', 'True/False/Not given', 'If the passage never mentions a claim either way, the answer is', ['True', 'False', 'Not given', 'Either True or False'], 2, '"Not given" means the text neither confirms nor contradicts it.', -0.5, 'understand'],
	['jupeb', 'economics', 'Elasticity', 'Goods with income elasticity below zero are', ['Normal goods', 'Luxury goods', 'Inferior goods', 'Giffen goods only'], 2, 'Demand falls as income rises.', 0.4, 'understand'],
	['jupeb', 'economics', 'National income', 'GDP minus depreciation equals', ['GNP', 'NDP', 'NNP', 'Disposable income'], 1, 'Net Domestic Product = GDP − capital consumption.', 0.6, 'remember'],
	// ── Skills ───────────────────────────────────────────────────────
	['skills', 'farm-records', 'Farm records', 'Mama Ngozi sold 20 baskets of tomatoes at ₦3,000 each. Her sales are', ['₦23,000', '₦60,000', '₦6,000', '₦600,000'], 1, '20 × ₦3,000 = ₦60,000. Write it in your sales record.', -1.2, 'apply'],
	['skills', 'farm-records', 'Costing', 'Seeds ₦8,000, fertiliser ₦12,000, labour ₦10,000. Sales ₦45,000. Profit is', ['₦15,000', '₦25,000', '₦30,000', '₦45,000'], 0, 'Costs = ₦30,000; ₦45,000 − ₦30,000 = ₦15,000.', -0.5, 'apply'],
	['skills', 'farm-records', 'Phone banking', 'Before you send money with a USSD code, you should first', ['Share your PIN with the agent', 'Check the account name shown', 'Turn off your phone', 'Send ₦1 to a stranger'], 1, 'Always confirm the receiver name. Never share your PIN.', -1.3, 'understand']
];

export const SEED_QUESTIONS: Question[] = ROWS.map((r, i) => ({
	id: `q${String(i + 1).padStart(3, '0')}`,
	exam: r[0],
	subject: r[1],
	topic: r[2],
	stem: r[3],
	options: r[4],
	answer: r[5],
	explanation: r[6],
	b: r[7],
	a: 1 + ((i * 37) % 7) / 10,
	bloom: r[8] ?? 'apply',
	status: 'reviewed',
	authorId: i % 3 === 0 ? 'u_tunde' : i % 3 === 1 ? 'u_bisi' : 'u_musa',
	servedCount: 200 + ((i * 131) % 900)
}));

/** WAEC/JAMB physics/chem subjects share items — map waec subject requests onto the jamb pool. */
export const bankFor = (all: Question[], exam: string, subject: string) => {
	const direct = all.filter((q) => q.exam === exam && q.subject === subject);
	if (direct.length) return direct;
	if (['waec', 'neco', 'nabteb'].includes(exam)) return all.filter((q) => q.exam === 'jamb' && q.subject === subject);
	return [];
};
