// Curated PhD-program target list (the user's researched "PhD" tab from
// researchtracker_2.xlsx). PhD programs are NOT on job boards, so unlike the
// other tracks these aren't fetched — they're seeded directly into the Discover
// inbox so the program list lives inside the app (with apply links + fit notes),
// one-click addable to the PhD board. A best-effort LIVE feed of newly-opened
// academic positions is layered on top via fetchEuraxess (see run.js).
//
// `bsEligible` encodes the single most important rule-out from the user's readme:
// US programs admit from a bachelor's; most EUROPEAN programs expect a master's
// first. IST Austria is the clean US-style exception (admits from BS). Deadlines
// are intentionally left null — they shift year to year, so the user fills the
// live date on the card rather than us shipping a stale value.
import { makeListing } from './normalize.js'

export const PHD_PROGRAMS = [
  // --- US: theory / computational pipeline ---
  { program: 'Computation & Neural Systems (CNS)', institution: 'Caltech', location: 'Pasadena, CA', country: 'US', bsEligible: true, url: 'https://www.cns.caltech.edu/admissions', note: 'Theory pipeline; built for quantitative people — strongest cultural fit.' },
  { program: 'Princeton Neuroscience Institute / QCN', institution: 'Princeton', location: 'Princeton, NJ', country: 'US', bsEligible: true, url: 'https://pni.princeton.edu/graduate-program', note: 'Very theory / computation heavy.' },
  { program: 'Redwood Center for Theoretical Neuroscience', institution: 'UC Berkeley', location: 'Berkeley, CA', country: 'US', bsEligible: true, url: 'https://redwood.berkeley.edu/', note: 'Theory-first; apply via a home dept (Neuroscience, Physics, EECS, Vision Science).' },
  { program: 'Center for Theoretical Neuroscience (Zuckerman)', institution: 'Columbia', location: 'New York, NY', country: 'US', bsEligible: true, url: 'https://www.theory.zuckermaninstitute.columbia.edu/', note: 'Strong theory group; rotation-based.' },

  // --- US: broad + computational track ---
  { program: 'Brain & Cognitive Sciences (BCS)', institution: 'MIT', location: 'Cambridge, MA', country: 'US', bsEligible: true, url: 'https://bcs.mit.edu/academic-program/graduate-program', note: 'Strong computational track.' },
  { program: 'Neurosciences PhD', institution: 'Stanford', location: 'Stanford, CA', country: 'US', bsEligible: true, url: 'https://neuroscience.stanford.edu/admissions', note: 'No GRE; holistic review.' },
  { program: 'Program in Neuroscience (PiN)', institution: 'Harvard', location: 'Boston, MA', country: 'US', bsEligible: true, url: 'https://pinphd.hms.harvard.edu/', note: 'Comp-neuro elective requirement.' },
  { program: 'Center for Neural Science', institution: 'NYU', location: 'New York, NY', country: 'US', bsEligible: true, url: 'https://as.nyu.edu/departments/cns/graduate.html', note: 'Broad + computational track.' },
  { program: 'Neural Computation (PNC) / CNBC', institution: 'Carnegie Mellon', location: 'Pittsburgh, PA', country: 'US', bsEligible: true, url: 'https://www.cnbc.cmu.edu/pnc/', note: 'Dedicated quant/theory PhD — built for non-biologists.' },
  { program: 'Neurosciences (Comp Neuro Specialization)', institution: 'UCSD', location: 'La Jolla, CA', country: 'US', bsEligible: true, url: 'https://neurograd.ucsd.edu/', note: 'Kleinfeld neurophysics; physics-friendly.' },
  { program: 'Neuroscience / Biomedical Engineering', institution: 'Johns Hopkins', location: 'Baltimore, MD', country: 'US', bsEligible: true, url: 'https://neuroscience.jhu.edu/programs/phd/', note: 'Broad; BME route also fits the signal-processing background.' },
  { program: 'Neuroscience', institution: 'University of Pennsylvania', location: 'Philadelphia, PA', country: 'US', bsEligible: true, url: 'https://www.med.upenn.edu/ngg/', note: 'Broad neuroscience graduate group.' },
  { program: 'Computational Neuroscience', institution: 'Boston University', location: 'Boston, MA', country: 'US', bsEligible: true, url: 'https://www.bu.edu/cn/', note: 'Broad + computational track.' },
  { program: 'Neuroscience', institution: 'Northwestern', location: 'Evanston, IL', country: 'US', bsEligible: true, url: 'https://www.nuin.northwestern.edu/', note: 'Broad neuroscience.' },

  // --- US: neuroengineering / BCI ---
  { program: 'Carney Institute (BrainGate)', institution: 'Brown', location: 'Providence, RI', country: 'US', bsEligible: true, url: 'https://www.brown.edu/carney/graduate-training', note: 'Home turf of BrainGate — neuroengineering / BCI.' },
  { program: 'Neural Engineering (CSNE legacy)', institution: 'University of Washington', location: 'Seattle, WA', country: 'US', bsEligible: true, url: 'https://www.engr.washington.edu/', note: 'Strong BCI / neural engineering; apply via a home dept (BioE/ECE).' },
  { program: 'Joint Neuroengineering', institution: 'Georgia Tech', location: 'Atlanta, GA', country: 'US', bsEligible: true, url: 'https://neuro.gatech.edu/graduate-programs', note: 'Emory–Georgia Tech joint neuroengineering.' },
  { program: 'Neural Engineering', institution: 'University of Michigan', location: 'Ann Arbor, MI', country: 'US', bsEligible: true, url: 'https://bme.umich.edu/academics/phd/', note: 'Neuroengineering via BME.' },

  // --- US: research-immersive ---
  { program: 'Watson School (Neuroscience)', institution: 'Cold Spring Harbor', location: 'Long Island, NY', country: 'US', bsEligible: true, url: 'https://www.cshl.edu/education/school-of-biological-sciences/', note: 'Small, elite, research-immersive; direct admission.' },

  // --- Europe: most expect a master's first (see bsEligible) ---
  { program: 'Institute of Neuroinformatics (INI / ZNZ)', institution: 'ETH Zurich', location: 'Zurich, CH', country: 'CH', bsEligible: false, url: 'https://www.ini.uzh.ch/en/teaching.html', note: 'Classic comp-neuro / neuromorphic; very physics-friendly. Usually wants a master’s — check BS eligibility.' },
  { program: 'Neuroscience PhD (EDNE) — Brain Mind / Neuro-X', institution: 'EPFL', location: 'Lausanne, CH', country: 'CH', bsEligible: false, url: 'https://www.epfl.ch/education/phd/edne-neuroscience/', note: 'English-language; strong comp + neuroengineering. Master’s typically expected.' },
  { program: 'Gatsby Computational Neuroscience Unit', institution: 'UCL', location: 'London, UK', country: 'UK', bsEligible: true, url: 'https://www.ucl.ac.uk/gatsby/study-gatsby/phd-programme', note: 'Global benchmark for theoretical neuro; admits strong BS candidates directly.' },
  { program: 'ISTA PhD (interdisciplinary)', institution: 'IST Austria', location: 'Klosterneuburg, AT', country: 'AT', bsEligible: true, url: 'https://ista.ac.at/en/education/phd-program/', note: 'Fully funded, all-English, ADMITS FROM BACHELOR’S — most US-like in Europe.' },
  { program: 'IMPRS schools (e.g. Intelligent Systems, Tübingen)', institution: 'Max Planck', location: 'Tübingen, DE', country: 'DE', bsEligible: false, url: 'https://imprs.is.mpg.de/', note: 'Funded, English; some admit from BS, some want a master’s — varies by school.' },
  { program: 'Champalimaud Neuroscience Programme', institution: 'Champalimaud', location: 'Lisbon, PT', country: 'PT', bsEligible: false, url: 'https://research.fchampalimaud.org/education/inp/', note: 'International, funded, English; very intl-friendly.' },
  { program: 'Cognitive / Theoretical Neuroscience', institution: 'SISSA', location: 'Trieste, IT', country: 'IT', bsEligible: false, url: 'https://phdcns.sissa.it/', note: 'Very theoretical; long physics-to-neuro pipeline.' },
  { program: 'Donders Institute', institution: 'Radboud University', location: 'Nijmegen, NL', country: 'NL', bsEligible: false, url: 'https://www.ru.nl/en/donders-institute', note: 'MAJOR MEG center — direct match to your edge. Often wants a master’s.' },
  { program: 'Edmond & Lily Safra Center (ELSC)', institution: 'Hebrew University', location: 'Jerusalem, IL', country: 'IL', bsEligible: false, url: 'https://elsc.huji.ac.il/phd-students/', note: 'Strong theoretical neuro; very physics-friendly.' },
  { program: 'Adaptive & Neural Computation (ANC)', institution: 'University of Edinburgh', location: 'Edinburgh, UK', country: 'UK', bsEligible: false, url: 'https://web.inf.ed.ac.uk/anc', note: 'Informatics-based comp neuro; UK PhD often wants a master’s.' },
]

// Map the curated programs to normalized Discover listings (track 'phd'). Stable
// ids come from the program URL via makeListing. The fit note + BS-eligibility
// ride along in the title/notes so they survive into the inbox card.
export function phdProgramListings() {
  return PHD_PROGRAMS.map((p) =>
    makeListing({
      title: p.program,
      company: p.institution,
      track: 'phd',
      location: p.location,
      url: p.url,
      source: 'phd-program',
      postedAt: null,
    }),
  )
}
