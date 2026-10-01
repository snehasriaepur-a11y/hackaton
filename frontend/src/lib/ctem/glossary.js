const GLOSSARY = {
  'ECOG Performance Status': {
    plain: 'How well a person manages daily activity on their own, scored 0 (fully active) to 5 (bedbound).',
    why: 'Trials cap this to make sure the treatment is tolerable for that person.'
  },
  'Hemoglobin': {
    plain: 'The oxygen-carrying protein in red blood cells, measured in g/dL.',
    why: 'Too low means anaemia, which adds risk during treatment.'
  },
  'Platelets': {
    plain: 'Blood cells that help clotting, counted per cubic millimetre.',
    why: 'Low platelets raise bleeding risk, so trials set a floor.'
  },
  'ANC': {
    plain: 'Absolute neutrophil count — the infection-fighting white blood cells, per cubic millimetre.',
    why: 'Very low counts mean the person cannot fight infection, so trials set a floor.'
  },
  'Creatinine': {
    plain: 'A blood marker of kidney filtering ability, in mg/dL.',
    why: 'Rising creatinine means reduced kidney function; many drugs clear through the kidneys.'
  },
  'AST / ALT': {
    plain: 'Liver enzymes. High values suggest liver stress or injury.',
    why: 'Trials check these because some drugs are processed by the liver.'
  },
  'Total Bilirubin': {
    plain: 'A yellow liver waste product in the blood, in mg/dL.',
    why: 'High bilirubin can signal impaired liver function.'
  },
  'LDH': {
    plain: 'Lactate dehydrogenase — a marker of rapid cell breakdown.',
    why: 'High LDH often tracks aggressive, fast-growing tumours.'
  },
  'AFP': {
    plain: 'Alpha-fetoprotein — a blood protein that can rise in liver and germ-cell tumours.',
    why: 'Used both to measure disease and as a trial eligibility threshold.'
  },
  'PD-L1 TPS': {
    plain: 'A test of how much of a certain protein tumour cells carry, scored 0–100%.',
    why: 'Predicts whether immune-system drugs are likely to work, so trials gate on it.'
  },
  'EGFR / ALK / ROS1': {
    plain: 'Genetic changes in cancer cells that some targeted drugs only work against.',
    why: 'If one is present, the person needs a targeted therapy rather than the trial drug.'
  },
  'BRAF': {
    plain: 'A cancer gene mutation that predicts response to targeted inhibitors.',
    why: 'Trials often require the BRAF status to be known, whatever the result.'
  },
  'NCT number': {
    plain: 'The unique registry ID for a clinical trial, e.g. NCT04128337.',
    why: 'Lets you look the exact protocol up on a public registry.'
  },
  'Inclusion criteria': {
    plain: 'The requirements a person must satisfy to be considered for the trial.',
    why: 'Failing a high-weight inclusion rule usually rules the person out.'
  },
  'Exclusion criteria': {
    plain: 'Conditions that disqualify a person even if they meet every requirement.',
    why: 'Any single exclusion triggered ends the evaluation immediately.'
  },
  'Evidence ledger': {
    plain: 'The list of documents the protocol requires, and whether each is on file and recent.',
    why: 'A missing required document makes eligibility provisional, not final.'
  },
  'ULN (upper limit of normal)': {
    plain: 'The top of the healthy range for a lab test, so results can be compared across hospitals.',
    why: 'Lets one rule like "AST above 3 × ULN" apply regardless of lab reference ranges.'
  },
  'Indeterminate': {
    plain: 'The record does not contain this information, so no decision can be made on it.',
    why: 'The engine refuses to guess — a coordinator has to supply the missing data.'
  },
  'Need for adjudication': {
    plain: 'The data has a contradiction or quality problem that a person must review.',
    why: 'Automated matching should not settle a conflict in the source record.'
  },
  'RECIST': {
    plain: 'The standard method for measuring whether a tumour shrank or grew on repeat scans.',
    why: 'Gives every site one comparable way to report change.'
  },
  'LI-RADS / BCLC / Child-Pugh': {
    plain: 'Standard scoring systems for liver scans, liver cancer stage, and liver function.',
    why: 'Trials use these so all sites assess the same patient the same way.'
  }
};

module.exports = { GLOSSARY };
