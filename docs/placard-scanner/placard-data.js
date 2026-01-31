/**
 * Hazmat Placard Data
 * Maps UN/NA numbers to chemical info, hazard classes, pictogram meanings, and SDS links.
 * Covers the most common hazardous materials encountered in transportation.
 */

const HAZARD_CLASSES = {
  "1": { name: "Explosives", color: "#FF4500", icon: "exploding-bomb" },
  "1.1": { name: "Explosives - Mass Explosion Hazard", color: "#FF4500", icon: "exploding-bomb" },
  "1.2": { name: "Explosives - Projection Hazard", color: "#FF4500", icon: "exploding-bomb" },
  "1.3": { name: "Explosives - Fire/Minor Blast/Projection", color: "#FF4500", icon: "exploding-bomb" },
  "1.4": { name: "Explosives - Minor Explosion Hazard", color: "#FF4500", icon: "exploding-bomb" },
  "1.5": { name: "Explosives - Very Insensitive", color: "#FF4500", icon: "exploding-bomb" },
  "1.6": { name: "Explosives - Extremely Insensitive", color: "#FF4500", icon: "exploding-bomb" },
  "2.1": { name: "Flammable Gas", color: "#FF0000", icon: "flame" },
  "2.2": { name: "Non-Flammable Non-Toxic Gas", color: "#00AA00", icon: "gas-cylinder" },
  "2.3": { name: "Toxic Gas", color: "#FFFFFF", icon: "skull-crossbones" },
  "3": { name: "Flammable Liquid", color: "#FF0000", icon: "flame" },
  "4.1": { name: "Flammable Solid", color: "#FF4444", icon: "flame" },
  "4.2": { name: "Spontaneously Combustible", color: "#FF4444", icon: "flame" },
  "4.3": { name: "Dangerous When Wet", color: "#0066FF", icon: "flame" },
  "5.1": { name: "Oxidizer", color: "#FFCC00", icon: "flame-over-circle" },
  "5.2": { name: "Organic Peroxide", color: "#FFCC00", icon: "flame-over-circle" },
  "6.1": { name: "Toxic Substance", color: "#FFFFFF", icon: "skull-crossbones" },
  "6.2": { name: "Infectious Substance", color: "#FFFFFF", icon: "biohazard" },
  "7": { name: "Radioactive Material", color: "#FFFF00", icon: "radioactive" },
  "8": { name: "Corrosive Substance", color: "#000000", icon: "corrosion" },
  "9": { name: "Miscellaneous Dangerous Goods", color: "#FFFFFF", icon: "exclamation" }
};

const GHS_PICTOGRAMS = {
  "exploding-bomb": {
    name: "Exploding Bomb",
    svg: "explosion",
    meaning: "Explosives, self-reactive substances, organic peroxides",
    precautions: ["Keep away from heat, sparks, open flames", "Do not handle until all safety precautions have been read", "Wear protective equipment"]
  },
  "flame": {
    name: "Flame",
    svg: "flame",
    meaning: "Flammable gases, aerosols, liquids, solids; pyrophoric substances; self-heating substances; substances that emit flammable gases when in contact with water",
    precautions: ["Keep away from heat, sparks, open flames, hot surfaces", "Keep container tightly closed", "Ground/bond container and receiving equipment", "Use explosion-proof electrical/ventilating/lighting equipment"]
  },
  "flame-over-circle": {
    name: "Flame Over Circle",
    svg: "oxidizer",
    meaning: "Oxidizers - may cause or intensify fire",
    precautions: ["Keep away from heat, sparks, open flames", "Keep away from clothing and other combustible materials", "Wear protective equipment"]
  },
  "gas-cylinder": {
    name: "Gas Cylinder",
    svg: "gas-cylinder",
    meaning: "Gases under pressure - may explode if heated",
    precautions: ["Protect from sunlight", "Store in well-ventilated place", "Use pressure-reducing valve"]
  },
  "corrosion": {
    name: "Corrosion",
    svg: "corrosion",
    meaning: "Corrosive to metals; causes severe skin burns and eye damage",
    precautions: ["Do not breathe dust/fumes/gas/mist/vapors/spray", "Wash thoroughly after handling", "Wear protective gloves/clothing/eye protection/face protection"]
  },
  "skull-crossbones": {
    name: "Skull and Crossbones",
    svg: "skull",
    meaning: "Acute toxicity (fatal or toxic if swallowed, in contact with skin, or if inhaled)",
    precautions: ["Wash hands thoroughly after handling", "Do not eat, drink, or smoke when using this product", "If swallowed: immediately call a Poison Center", "Wear protective equipment"]
  },
  "exclamation": {
    name: "Exclamation Mark",
    svg: "exclamation",
    meaning: "Irritant; skin sensitizer; acute toxicity (harmful); narcotic effects; respiratory tract irritation; hazardous to ozone layer",
    precautions: ["Avoid breathing dust/fumes/gas/mist", "Use only outdoors or in well-ventilated area", "Wear protective equipment"]
  },
  "health-hazard": {
    name: "Health Hazard",
    svg: "health-hazard",
    meaning: "Carcinogen; mutagenicity; reproductive toxicity; respiratory sensitizer; target organ toxicity; aspiration toxicity",
    precautions: ["Obtain special instructions before use", "Do not handle until safety precautions are read", "Use personal protective equipment as required"]
  },
  "biohazard": {
    name: "Biohazard",
    svg: "biohazard",
    meaning: "Infectious substances - capable of causing disease in humans or animals",
    precautions: ["Avoid contact with skin and eyes", "Wear appropriate personal protective equipment", "Decontaminate all materials before disposal"]
  },
  "radioactive": {
    name: "Radioactive",
    svg: "radioactive",
    meaning: "Radioactive material - emits ionizing radiation",
    precautions: ["Minimize exposure time", "Maximize distance from source", "Use appropriate shielding", "Monitor radiation levels"]
  },
  "environment": {
    name: "Environment",
    svg: "environment",
    meaning: "Hazardous to the aquatic environment",
    precautions: ["Avoid release to the environment", "Collect spillage", "Dispose of contents/container in accordance with regulations"]
  }
};

// Common UN numbers database - most frequently encountered in transportation
const UN_NUMBERS = {
  "1001": { name: "Acetylene, dissolved", class: "2.1", sds: "acetylene", guide: 116 },
  "1005": { name: "Ammonia, anhydrous", class: "2.3", sds: "ammonia-anhydrous", guide: 125, secondaryHazard: ["8"] },
  "1006": { name: "Argon, compressed", class: "2.2", sds: "argon", guide: 121 },
  "1011": { name: "Butane", class: "2.1", sds: "butane", guide: 115 },
  "1013": { name: "Carbon dioxide", class: "2.2", sds: "carbon-dioxide", guide: 120 },
  "1017": { name: "Chlorine", class: "2.3", sds: "chlorine", guide: 124, secondaryHazard: ["5.1", "8"] },
  "1023": { name: "Coal gas, compressed", class: "2.3", sds: "coal-gas", guide: 119, secondaryHazard: ["2.1"] },
  "1038": { name: "Ethylene, refrigerated liquid", class: "2.1", sds: "ethylene", guide: 115 },
  "1040": { name: "Ethylene oxide", class: "2.3", sds: "ethylene-oxide", guide: "119P", secondaryHazard: ["2.1"] },
  "1049": { name: "Hydrogen, compressed", class: "2.1", sds: "hydrogen", guide: 115 },
  "1050": { name: "Hydrogen chloride, anhydrous", class: "2.3", sds: "hydrogen-chloride", guide: 125, secondaryHazard: ["8"] },
  "1053": { name: "Hydrogen sulfide", class: "2.3", sds: "hydrogen-sulfide", guide: 117, secondaryHazard: ["2.1"] },
  "1066": { name: "Nitrogen, compressed", class: "2.2", sds: "nitrogen", guide: 121 },
  "1072": { name: "Oxygen, compressed", class: "2.2", sds: "oxygen", guide: 122, secondaryHazard: ["5.1"] },
  "1073": { name: "Oxygen, refrigerated liquid", class: "2.2", sds: "oxygen-liquid", guide: 122, secondaryHazard: ["5.1"] },
  "1075": { name: "Petroleum gases, liquefied (LPG)", class: "2.1", sds: "lpg", guide: 115 },
  "1076": { name: "Phosgene", class: "2.3", sds: "phosgene", guide: 125, secondaryHazard: ["8"] },
  "1079": { name: "Sulfur dioxide", class: "2.3", sds: "sulfur-dioxide", guide: 125, secondaryHazard: ["8"] },
  "1090": { name: "Acetone", class: "3", sds: "acetone", guide: 127 },
  "1114": { name: "Benzene", class: "3", sds: "benzene", guide: 130 },
  "1170": { name: "Ethanol (Ethyl alcohol)", class: "3", sds: "ethanol", guide: 127 },
  "1173": { name: "Ethyl acetate", class: "3", sds: "ethyl-acetate", guide: 129 },
  "1202": { name: "Diesel fuel", class: "3", sds: "diesel-fuel", guide: 128 },
  "1203": { name: "Gasoline (Petrol)", class: "3", sds: "gasoline", guide: 128 },
  "1230": { name: "Methanol", class: "3", sds: "methanol", guide: 131, secondaryHazard: ["6.1"] },
  "1263": { name: "Paint", class: "3", sds: "paint-flammable", guide: 128 },
  "1267": { name: "Petroleum crude oil", class: "3", sds: "crude-oil", guide: 128 },
  "1268": { name: "Petroleum distillates, n.o.s.", class: "3", sds: "petroleum-distillates", guide: 128 },
  "1270": { name: "Petroleum oil", class: "3", sds: "petroleum-oil", guide: 128 },
  "1294": { name: "Toluene", class: "3", sds: "toluene", guide: 130 },
  "1300": { name: "Turpentine substitute", class: "3", sds: "turpentine", guide: 128 },
  "1307": { name: "Xylenes", class: "3", sds: "xylenes", guide: 130 },
  "1350": { name: "Sulfur", class: "4.1", sds: "sulfur", guide: 133 },
  "1381": { name: "Phosphorus, white, dry", class: "4.2", sds: "phosphorus-white", guide: 136, secondaryHazard: ["6.1"] },
  "1402": { name: "Calcium carbide", class: "4.3", sds: "calcium-carbide", guide: 138 },
  "1428": { name: "Sodium", class: "4.3", sds: "sodium", guide: 138 },
  "1463": { name: "Chromium trioxide, anhydrous", class: "5.1", sds: "chromium-trioxide", guide: 141, secondaryHazard: ["6.1", "8"] },
  "1495": { name: "Sodium chlorate", class: "5.1", sds: "sodium-chlorate", guide: 140 },
  "1547": { name: "Aniline", class: "6.1", sds: "aniline", guide: 153 },
  "1593": { name: "Dichloromethane (Methylene chloride)", class: "6.1", sds: "dichloromethane", guide: 160 },
  "1613": { name: "Hydrogen cyanide, aqueous (<20%)", class: "6.1", sds: "hydrogen-cyanide", guide: 154 },
  "1680": { name: "Potassium cyanide", class: "6.1", sds: "potassium-cyanide", guide: 157 },
  "1689": { name: "Sodium cyanide", class: "6.1", sds: "sodium-cyanide", guide: 157 },
  "1710": { name: "Trichloroethylene", class: "6.1", sds: "trichloroethylene", guide: 160 },
  "1723": { name: "Allyl iodide", class: "3", sds: "allyl-iodide", guide: 132, secondaryHazard: ["6.1"] },
  "1760": { name: "Corrosive liquid, n.o.s.", class: "8", sds: "corrosive-liquid", guide: 154 },
  "1789": { name: "Hydrochloric acid", class: "8", sds: "hydrochloric-acid", guide: 157 },
  "1791": { name: "Hypochlorite solution (Bleach)", class: "8", sds: "sodium-hypochlorite", guide: 154 },
  "1805": { name: "Phosphoric acid solution", class: "8", sds: "phosphoric-acid", guide: 154 },
  "1823": { name: "Sodium hydroxide, solid (Caustic soda)", class: "8", sds: "sodium-hydroxide", guide: 154 },
  "1824": { name: "Sodium hydroxide solution", class: "8", sds: "sodium-hydroxide-solution", guide: 154 },
  "1830": { name: "Sulfuric acid (>51%)", class: "8", sds: "sulfuric-acid", guide: 137 },
  "1831": { name: "Sulfuric acid, fuming", class: "8", sds: "sulfuric-acid-fuming", guide: 137, secondaryHazard: ["6.1"] },
  "1863": { name: "Fuel, aviation, turbine engine", class: "3", sds: "jet-fuel", guide: 128 },
  "1866": { name: "Resin solution, flammable", class: "3", sds: "resin-solution", guide: 128 },
  "1897": { name: "Tetrachloroethylene", class: "6.1", sds: "tetrachloroethylene", guide: 160 },
  "1908": { name: "Chlorite solution", class: "8", sds: "chlorite-solution", guide: 154 },
  "1942": { name: "Ammonium nitrate", class: "5.1", sds: "ammonium-nitrate", guide: 140 },
  "1950": { name: "Aerosols, flammable", class: "2.1", sds: "aerosols-flammable", guide: 126 },
  "1951": { name: "Argon, refrigerated liquid", class: "2.2", sds: "argon-liquid", guide: 120 },
  "1966": { name: "Hydrogen, refrigerated liquid", class: "2.1", sds: "hydrogen-liquid", guide: 115 },
  "1971": { name: "Methane, compressed (Natural gas)", class: "2.1", sds: "methane", guide: 115 },
  "1972": { name: "Methane, refrigerated liquid (LNG)", class: "2.1", sds: "lng", guide: 115 },
  "1977": { name: "Nitrogen, refrigerated liquid", class: "2.2", sds: "nitrogen-liquid", guide: 120 },
  "1978": { name: "Propane", class: "2.1", sds: "propane", guide: 115 },
  "1986": { name: "Alcohols, flammable, toxic, n.o.s.", class: "3", sds: "alcohols-flammable-toxic", guide: 131, secondaryHazard: ["6.1"] },
  "1987": { name: "Alcohols, n.o.s.", class: "3", sds: "alcohols", guide: 127 },
  "1993": { name: "Flammable liquid, n.o.s.", class: "3", sds: "flammable-liquid", guide: 128 },
  "1999": { name: "Tars, liquid", class: "3", sds: "tars-liquid", guide: 128 },
  "2014": { name: "Hydrogen peroxide, aqueous (>20%)", class: "5.1", sds: "hydrogen-peroxide", guide: 140, secondaryHazard: ["8"] },
  "2015": { name: "Hydrogen peroxide, stabilized (>60%)", class: "5.1", sds: "hydrogen-peroxide-stabilized", guide: 144, secondaryHazard: ["8"] },
  "2031": { name: "Nitric acid (>70%)", class: "8", sds: "nitric-acid", guide: 157, secondaryHazard: ["5.1"] },
  "2032": { name: "Nitric acid, fuming", class: "8", sds: "nitric-acid-fuming", guide: 157, secondaryHazard: ["5.1", "6.1"] },
  "2055": { name: "Styrene monomer, stabilized", class: "3", sds: "styrene", guide: "128P" },
  "2209": { name: "Formaldehyde solution (37%)", class: "8", sds: "formaldehyde", guide: 132, secondaryHazard: ["6.1"] },
  "2304": { name: "Naphthalene, molten", class: "4.1", sds: "naphthalene", guide: 133 },
  "2448": { name: "Sulfur, molten", class: "4.1", sds: "sulfur-molten", guide: 133 },
  "2672": { name: "Ammonia solution (10-35%)", class: "8", sds: "ammonia-solution", guide: 154 },
  "2735": { name: "Amines, liquid, corrosive, n.o.s.", class: "8", sds: "amines-corrosive", guide: 153 },
  "2810": { name: "Toxic liquid, organic, n.o.s.", class: "6.1", sds: "toxic-liquid-organic", guide: 153 },
  "2811": { name: "Toxic solid, organic, n.o.s.", class: "6.1", sds: "toxic-solid-organic", guide: 154 },
  "2814": { name: "Infectious substance, affecting humans", class: "6.2", sds: "infectious-substance", guide: 158 },
  "2820": { name: "Butyric acid", class: "8", sds: "butyric-acid", guide: 153 },
  "2902": { name: "Pesticide, liquid, toxic, n.o.s.", class: "6.1", sds: "pesticide-toxic", guide: 151 },
  "2910": { name: "Radioactive material, excepted package", class: "7", sds: "radioactive-excepted", guide: 161 },
  "2911": { name: "Radioactive material, excepted package - instruments", class: "7", sds: "radioactive-instruments", guide: 161 },
  "2915": { name: "Radioactive material, Type A package", class: "7", sds: "radioactive-type-a", guide: 161 },
  "2977": { name: "Radioactive material, Uranium hexafluoride, fissile", class: "7", sds: "uranium-hexafluoride", guide: 166, secondaryHazard: ["6.1", "8"] },
  "3077": { name: "Environmentally hazardous substance, solid, n.o.s.", class: "9", sds: "env-hazardous-solid", guide: 171 },
  "3082": { name: "Environmentally hazardous substance, liquid, n.o.s.", class: "9", sds: "env-hazardous-liquid", guide: 171 },
  "3175": { name: "Solids containing flammable liquid, n.o.s.", class: "4.1", sds: "solids-flammable-liquid", guide: 133 },
  "3257": { name: "Elevated temperature liquid, n.o.s.", class: "9", sds: "elevated-temp-liquid", guide: 128 },
  "3264": { name: "Corrosive liquid, acidic, inorganic, n.o.s.", class: "8", sds: "corrosive-acidic-inorganic", guide: 154 },
  "3266": { name: "Corrosive liquid, basic, inorganic, n.o.s.", class: "8", sds: "corrosive-basic-inorganic", guide: 154 },
  "3291": { name: "Clinical waste, unspecified / Regulated medical waste", class: "6.2", sds: "clinical-waste", guide: 158 },
  "3334": { name: "Aviation regulated liquid, n.o.s.", class: "9", sds: "aviation-regulated-liquid", guide: 171 },
  "3335": { name: "Aviation regulated solid, n.o.s.", class: "9", sds: "aviation-regulated-solid", guide: 171 },
  "3373": { name: "Biological substance, Category B", class: "6.2", sds: "biological-substance-b", guide: 158 },
  "3480": { name: "Lithium ion batteries", class: "9", sds: "lithium-ion-batteries", guide: 147 },
  "3481": { name: "Lithium ion batteries contained in/packed with equipment", class: "9", sds: "lithium-ion-batteries-equipment", guide: 147 },
  "3496": { name: "Batteries, nickel-metal hydride", class: "9", sds: "nimh-batteries", guide: 147 }
};

// NFPA 704 Diamond ratings
const NFPA_RATINGS = {
  health: {
    0: { level: "Minimal", description: "No significant risk to health" },
    1: { level: "Slight", description: "Exposure would cause irritation with only minor residual injury" },
    2: { level: "Moderate", description: "Intense or continued exposure could cause temporary incapacitation or possible residual injury" },
    3: { level: "Serious", description: "Short exposure could cause serious temporary or moderate residual injury" },
    4: { level: "Deadly", description: "Very short exposure could cause death or major residual injury" }
  },
  flammability: {
    0: { level: "Minimal", description: "Materials that will not burn under typical fire conditions" },
    1: { level: "Slight", description: "Materials that require considerable preheating before ignition can occur. Flash point over 200\u00B0F (93\u00B0C)" },
    2: { level: "Moderate", description: "Must be moderately heated before ignition can occur. Flash point between 100-200\u00B0F (38-93\u00B0C)" },
    3: { level: "Serious", description: "Liquids and solids that can be ignited under almost all ambient temperature conditions. Flash point below 100\u00B0F (38\u00B0C)" },
    4: { level: "Deadly", description: "Materials which will rapidly vaporize at atmospheric pressure and normal temperatures, and will burn readily. Flash point below 73\u00B0F (23\u00B0C)" }
  },
  instability: {
    0: { level: "Stable", description: "Normally stable, even under fire exposure conditions" },
    1: { level: "Unstable", description: "Normally stable, but can become unstable at elevated temperatures and pressures" },
    2: { level: "Dangerous", description: "Undergoes violent chemical change at elevated temperatures and pressures" },
    3: { level: "Very Dangerous", description: "Capable of detonation or explosive decomposition, but requires a strong initiating source" },
    4: { level: "Extreme", description: "Readily capable of detonation or explosive decomposition at normal temperatures and pressures" }
  },
  special: {
    "W": "Do not use water",
    "OX": "Oxidizer",
    "SA": "Simple asphyxiant",
    "COR": "Corrosive",
    "BIO": "Biological hazard",
    "RAD": "Radioactive",
    "CRYO": "Cryogenic",
    "ALK": "Alkali"
  }
};

// ERG (Emergency Response Guidebook) guide pages
function getERGGuideUrl(guideNumber) {
  return `https://www.phmsa.dot.gov/hazmat/erg/emergency-response-guidebook-erg`;
}

// SDS lookup URLs - multiple sources
function getSDSUrls(substance) {
  const encodedName = encodeURIComponent(substance.name);
  return [
    {
      name: "Fisher Scientific SDS",
      url: `https://www.fishersci.com/us/en/catalog/search/sds?keyword=${encodedName}`
    },
    {
      name: "Sigma-Aldrich SDS",
      url: `https://www.sigmaaldrich.com/US/en/search/${encodedName}?focus=documents&page=1&perpage=30&sort=relevance&term=${encodedName}&type=sds`
    },
    {
      name: "CAMEO Chemicals (NOAA)",
      url: `https://cameochemicals.noaa.gov/search/simple?la=en&q=${encodedName}`
    },
    {
      name: "ERG Guide",
      url: getERGGuideUrl(substance.guide)
    },
    {
      name: "NIOSH Pocket Guide",
      url: `https://www.cdc.gov/niosh/npg/search.html?searchTerm=${encodedName}`
    }
  ];
}
