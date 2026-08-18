import { readFileSync, writeFileSync } from "fs"

const DATA_PATH = new URL("../src/data/celestialObjects.json", import.meta.url)
const dataset = JSON.parse(readFileSync(DATA_PATH, "utf-8"))

// Area (sq deg), hemisphere, and brightest-star magnitude verified against
// Wikipedia's "IAU designated constellations" table.
const NEW_OBJECTS = [
  { id: "antlia", name: "Antlia", hemisphere: "southern", areaSqDeg: 239, brightestStarMagnitude: 4.25, difficulty: 4, description: "A faint southern constellation representing an air pump, one of the constellations introduced by Nicolas-Louis de Lacaille in the 18th century." },
  { id: "apus", name: "Apus", hemisphere: "southern", areaSqDeg: 206, brightestStarMagnitude: 3.83, difficulty: 4, description: "A small southern constellation representing a bird-of-paradise, first depicted on a 16th-century celestial globe." },
  { id: "aquarius", name: "Aquarius", hemisphere: "southern", areaSqDeg: 980, brightestStarMagnitude: 2.87, difficulty: 2, description: "A zodiac constellation depicting a water-bearer, home to the radiant point of the annual Aquariid meteor showers." },
  { id: "aquila", name: "Aquila", hemisphere: "northern", areaSqDeg: 652, brightestStarMagnitude: 0.76, difficulty: 2, description: "Represents an eagle in Greek mythology, marked by its brightest star Altair, one point of the Summer Triangle." },
  { id: "ara", name: "Ara", hemisphere: "southern", areaSqDeg: 237, brightestStarMagnitude: 2.84, difficulty: 3, description: "A southern constellation representing an altar, located near the tail of Scorpius." },
  { id: "aries", name: "Aries", hemisphere: "northern", areaSqDeg: 441, brightestStarMagnitude: 2.00, difficulty: 2, description: "A zodiac constellation depicting a ram, historically marking the location of the vernal equinox in ancient astronomy." },
  { id: "auriga", name: "Auriga", hemisphere: "northern", areaSqDeg: 657, brightestStarMagnitude: 0.08, difficulty: 2, description: "Represents a charioteer, marked by the bright star Capella and several notable open star clusters." },
  { id: "bootes", name: "Boötes", hemisphere: "northern", areaSqDeg: 907, brightestStarMagnitude: -0.05, difficulty: 3, description: "Represents a herdsman, home to Arcturus, one of the brightest stars in the night sky." },
  { id: "caelum", name: "Caelum", hemisphere: "southern", areaSqDeg: 125, brightestStarMagnitude: 4.46, difficulty: 5, description: "One of the faintest constellations, representing an engraving tool, introduced by Lacaille." },
  { id: "camelopardalis", name: "Camelopardalis", hemisphere: "northern", areaSqDeg: 757, brightestStarMagnitude: 4.02, difficulty: 4, description: "A large but faint northern constellation representing a giraffe." },
  { id: "cancer", name: "Cancer", hemisphere: "northern", areaSqDeg: 506, brightestStarMagnitude: 3.52, difficulty: 2, description: "The dimmest zodiac constellation, representing a crab, home to the Beehive Cluster." },
  { id: "canes_venatici", name: "Canes Venatici", hemisphere: "northern", areaSqDeg: 465, brightestStarMagnitude: 2.81, difficulty: 4, description: "Represents hunting dogs, home to the Whirlpool Galaxy." },
  { id: "canis_major", name: "Canis Major", hemisphere: "southern", areaSqDeg: 380, brightestStarMagnitude: -1.46, difficulty: 2, description: "Represents the greater dog, containing Sirius, the brightest star in the night sky." },
  { id: "canis_minor", name: "Canis Minor", hemisphere: "northern", areaSqDeg: 183, brightestStarMagnitude: 0.34, difficulty: 3, description: "Represents the lesser dog, marked by the bright star Procyon." },
  { id: "capricornus", name: "Capricornus", hemisphere: "southern", areaSqDeg: 414, brightestStarMagnitude: 2.81, difficulty: 2, description: "A zodiac constellation depicting a sea-goat, one of the faintest zodiac constellations." },
  { id: "carina", name: "Carina", hemisphere: "southern", areaSqDeg: 494, brightestStarMagnitude: -0.74, difficulty: 3, description: "Represents the keel of the ship Argo, home to the bright star Canopus and the Carina Nebula." },
  { id: "centaurus", name: "Centaurus", hemisphere: "southern", areaSqDeg: 1060, brightestStarMagnitude: -0.27, difficulty: 2, description: "Represents a centaur, home to Alpha Centauri, the closest star system to the Sun." },
  { id: "cepheus", name: "Cepheus", hemisphere: "northern", areaSqDeg: 588, brightestStarMagnitude: 2.46, difficulty: 3, description: "Represents a mythological king of Aethiopia, home to several notable variable stars." },
  { id: "cetus", name: "Cetus", hemisphere: "southern", areaSqDeg: 1231, brightestStarMagnitude: 2.02, difficulty: 2, description: "Represents a sea monster or whale, home to the famous variable star Mira." },
  { id: "chamaeleon", name: "Chamaeleon", hemisphere: "southern", areaSqDeg: 132, brightestStarMagnitude: 4.06, difficulty: 4, description: "A small, faint southern constellation representing a chameleon." },
  { id: "circinus", name: "Circinus", hemisphere: "southern", areaSqDeg: 93, brightestStarMagnitude: 3.19, difficulty: 5, description: "One of the smallest constellations, representing a drafting compass." },
  { id: "columba", name: "Columba", hemisphere: "southern", areaSqDeg: 270, brightestStarMagnitude: 2.65, difficulty: 5, description: "Represents a dove, sometimes associated with the dove released from Noah's Ark." },
  { id: "coma_berenices", name: "Coma Berenices", hemisphere: "northern", areaSqDeg: 386, brightestStarMagnitude: 4.26, difficulty: 4, description: "Named after the hair of Queen Berenice II of Egypt, home to a rich cluster of galaxies." },
  { id: "corona_australis", name: "Corona Australis", hemisphere: "southern", areaSqDeg: 128, brightestStarMagnitude: 4.09, difficulty: 4, description: "Represents a southern crown, one of the 48 constellations listed by the ancient astronomer Ptolemy." },
  { id: "corona_borealis", name: "Corona Borealis", hemisphere: "northern", areaSqDeg: 179, brightestStarMagnitude: 2.24, difficulty: 3, description: "Represents a northern crown, associated in Greek mythology with the crown of Ariadne." },
  { id: "corvus", name: "Corvus", hemisphere: "southern", areaSqDeg: 184, brightestStarMagnitude: 2.59, difficulty: 3, description: "Represents a crow, a small constellation associated with the myth of Apollo." },
  { id: "crater", name: "Crater", hemisphere: "southern", areaSqDeg: 282, brightestStarMagnitude: 3.56, difficulty: 3, description: "Represents a cup, associated in mythology with the god Apollo." },
  { id: "delphinus", name: "Delphinus", hemisphere: "northern", areaSqDeg: 189, brightestStarMagnitude: 3.62, difficulty: 3, description: "A small constellation representing a dolphin, easily recognized despite containing no especially bright stars." },
  { id: "dorado", name: "Dorado", hemisphere: "southern", areaSqDeg: 179, brightestStarMagnitude: 3.26, difficulty: 4, description: "Represents a dolphinfish, home to most of the Large Magellanic Cloud." },
  { id: "draco", name: "Draco", hemisphere: "northern", areaSqDeg: 1083, brightestStarMagnitude: 2.23, difficulty: 2, description: "Represents a dragon coiled around the north celestial pole, one of the largest constellations." },
  { id: "equuleus", name: "Equuleus", hemisphere: "northern", areaSqDeg: 72, brightestStarMagnitude: 3.92, difficulty: 4, description: "The second-smallest constellation, representing a small horse or foal." },
  { id: "eridanus", name: "Eridanus", hemisphere: "southern", areaSqDeg: 1138, brightestStarMagnitude: 0.43, difficulty: 2, description: "Represents a river, one of the largest constellations, stretching from near Orion to the southern star Achernar." },
  { id: "fornax", name: "Fornax", hemisphere: "southern", areaSqDeg: 398, brightestStarMagnitude: 3.92, difficulty: 4, description: "Represents a furnace, introduced by Lacaille and home to the Fornax Cluster of galaxies." },
  { id: "gemini", name: "Gemini", hemisphere: "northern", areaSqDeg: 514, brightestStarMagnitude: 1.14, difficulty: 2, description: "A zodiac constellation representing twins, marked by the bright stars Castor and Pollux." },
  { id: "grus", name: "Grus", hemisphere: "southern", areaSqDeg: 366, brightestStarMagnitude: 1.74, difficulty: 3, description: "Represents a crane, one of twelve constellations introduced by Dutch navigators in the late 16th century." },
  { id: "hercules", name: "Hercules", hemisphere: "northern", areaSqDeg: 1225, brightestStarMagnitude: 2.81, difficulty: 2, description: "Represents the mythological hero, home to the Great Globular Cluster, one of the brightest globular clusters visible from the north." },
  { id: "horologium", name: "Horologium", hemisphere: "southern", areaSqDeg: 249, brightestStarMagnitude: 3.85, difficulty: 5, description: "Represents a pendulum clock, one of the faintest constellations introduced by Lacaille." },
  { id: "hydra", name: "Hydra", hemisphere: "southern", areaSqDeg: 1303, brightestStarMagnitude: 2.00, difficulty: 2, description: "The largest of all 88 constellations, representing a water serpent." },
  { id: "hydrus", name: "Hydrus", hemisphere: "southern", areaSqDeg: 243, brightestStarMagnitude: 2.80, difficulty: 4, description: "Represents a male water snake, not to be confused with the much larger constellation Hydra." },
  { id: "indus", name: "Indus", hemisphere: "southern", areaSqDeg: 294, brightestStarMagnitude: 3.11, difficulty: 4, description: "Represents an indigenous person, one of twelve constellations introduced by Dutch navigators." },
  { id: "lacerta", name: "Lacerta", hemisphere: "northern", areaSqDeg: 201, brightestStarMagnitude: 3.76, difficulty: 4, description: "A small, faint northern constellation representing a lizard." },
  { id: "leo_minor", name: "Leo Minor", hemisphere: "northern", areaSqDeg: 232, brightestStarMagnitude: 3.83, difficulty: 4, description: "A faint constellation representing a smaller lion, introduced in the 17th century." },
  { id: "lepus", name: "Lepus", hemisphere: "southern", areaSqDeg: 290, brightestStarMagnitude: 2.59, difficulty: 3, description: "Represents a hare, positioned just south of Orion." },
  { id: "libra", name: "Libra", hemisphere: "southern", areaSqDeg: 538, brightestStarMagnitude: 2.61, difficulty: 2, description: "The only zodiac constellation representing an inanimate object, a set of scales." },
  { id: "lupus", name: "Lupus", hemisphere: "southern", areaSqDeg: 334, brightestStarMagnitude: 2.30, difficulty: 3, description: "Represents a wolf, one of the 48 constellations listed by Ptolemy in antiquity." },
  { id: "lynx", name: "Lynx", hemisphere: "northern", areaSqDeg: 545, brightestStarMagnitude: 3.14, difficulty: 4, description: "A faint northern constellation representing a lynx, said to require lynx-like eyesight to see." },
  { id: "lyra", name: "Lyra", hemisphere: "northern", areaSqDeg: 286, brightestStarMagnitude: 0.03, difficulty: 2, description: "Represents a lyre, home to Vega, one of the brightest stars in the northern sky." },
  { id: "mensa", name: "Mensa", hemisphere: "southern", areaSqDeg: 153, brightestStarMagnitude: 5.09, difficulty: 5, description: "The faintest of all 88 constellations, named after Table Mountain in South Africa." },
  { id: "microscopium", name: "Microscopium", hemisphere: "southern", areaSqDeg: 210, brightestStarMagnitude: 4.68, difficulty: 5, description: "Represents a microscope, one of the faint constellations introduced by Lacaille." },
  { id: "monoceros", name: "Monoceros", hemisphere: "northern", areaSqDeg: 482, brightestStarMagnitude: 3.74, difficulty: 4, description: "Represents a unicorn, a faint constellation straddling the celestial equator near Orion." },
  { id: "musca", name: "Musca", hemisphere: "southern", areaSqDeg: 138, brightestStarMagnitude: 2.69, difficulty: 5, description: "Represents a fly, the only official constellation depicting an insect." },
  { id: "norma", name: "Norma", hemisphere: "southern", areaSqDeg: 165, brightestStarMagnitude: 4.02, difficulty: 4, description: "Represents a carpenter's square, one of the smaller constellations introduced by Lacaille." },
  { id: "octans", name: "Octans", hemisphere: "southern", areaSqDeg: 291, brightestStarMagnitude: 3.73, difficulty: 5, description: "Contains the south celestial pole, though it has no bright star marking it precisely as Polaris does in the north." },
  { id: "ophiuchus", name: "Ophiuchus", hemisphere: "northern", areaSqDeg: 948, brightestStarMagnitude: 2.07, difficulty: 2, description: "Represents a serpent-bearer, straddling the ecliptic and sometimes called the 13th zodiac sign." },
  { id: "pavo", name: "Pavo", hemisphere: "southern", areaSqDeg: 378, brightestStarMagnitude: 1.94, difficulty: 4, description: "Represents a peacock, one of twelve constellations introduced by Dutch navigators." },
  { id: "pegasus", name: "Pegasus", hemisphere: "northern", areaSqDeg: 1121, brightestStarMagnitude: 2.40, difficulty: 2, description: "Represents a winged horse from Greek mythology, marked by the Great Square asterism." },
  { id: "perseus", name: "Perseus", hemisphere: "northern", areaSqDeg: 615, brightestStarMagnitude: 1.82, difficulty: 2, description: "Represents the mythological hero, home to the annual Perseid meteor shower's radiant point." },
  { id: "phoenix", name: "Phoenix", hemisphere: "southern", areaSqDeg: 469, brightestStarMagnitude: 2.38, difficulty: 3, description: "Represents the mythical bird reborn from ashes, one of twelve constellations introduced by Dutch navigators." },
  { id: "pictor", name: "Pictor", hemisphere: "southern", areaSqDeg: 247, brightestStarMagnitude: 3.27, difficulty: 4, description: "Represents a painter's easel, a faint constellation introduced by Lacaille." },
  { id: "pisces", name: "Pisces", hemisphere: "northern", areaSqDeg: 889, brightestStarMagnitude: 3.61, difficulty: 2, description: "A zodiac constellation representing two fish, containing the vernal equinox point in modern astronomy." },
  { id: "piscis_austrinus", name: "Piscis Austrinus", hemisphere: "southern", areaSqDeg: 245, brightestStarMagnitude: 1.16, difficulty: 3, description: "Represents a southern fish, home to the bright star Fomalhaut." },
  { id: "puppis", name: "Puppis", hemisphere: "southern", areaSqDeg: 673, brightestStarMagnitude: 2.25, difficulty: 3, description: "Represents the stern of the ship Argo, the largest of the three constellations formed from the ancient constellation Argo Navis." },
  { id: "pyxis", name: "Pyxis", hemisphere: "southern", areaSqDeg: 221, brightestStarMagnitude: 3.67, difficulty: 4, description: "Represents a mariner's compass, a small constellation once considered part of the ship Argo Navis." },
  { id: "reticulum", name: "Reticulum", hemisphere: "southern", areaSqDeg: 114, brightestStarMagnitude: 3.32, difficulty: 5, description: "A small southern constellation representing a reticle, the crosshairs used in optical instruments." },
  { id: "sagitta", name: "Sagitta", hemisphere: "northern", areaSqDeg: 80, brightestStarMagnitude: 3.47, difficulty: 3, description: "Represents an arrow, the third-smallest constellation despite being one of the oldest recognized." },
  { id: "sculptor", name: "Sculptor", hemisphere: "southern", areaSqDeg: 475, brightestStarMagnitude: 4.30, difficulty: 3, description: "Represents a sculptor's workshop, home to the south galactic pole." },
  { id: "scutum", name: "Scutum", hemisphere: "northern", areaSqDeg: 109, brightestStarMagnitude: 3.83, difficulty: 4, description: "Represents a shield, home to a dense field of the Milky Way including the Wild Duck Cluster." },
  { id: "serpens", name: "Serpens", hemisphere: "northern", areaSqDeg: 637, brightestStarMagnitude: 2.62, difficulty: 3, description: "The only constellation split into two separate regions, representing a serpent held by Ophiuchus." },
  { id: "sextans", name: "Sextans", hemisphere: "southern", areaSqDeg: 314, brightestStarMagnitude: 4.49, difficulty: 4, description: "Represents an astronomical sextant, a faint constellation introduced by Johannes Hevelius." },
  { id: "taurus", name: "Taurus", hemisphere: "northern", areaSqDeg: 797, brightestStarMagnitude: 0.86, difficulty: 2, description: "A zodiac constellation representing a bull, home to both the Pleiades and Hyades star clusters." },
  { id: "telescopium", name: "Telescopium", hemisphere: "southern", areaSqDeg: 252, brightestStarMagnitude: 3.51, difficulty: 4, description: "Represents a telescope, one of the fainter constellations introduced by Lacaille." },
  { id: "triangulum_constellation", name: "Triangulum (constellation)", hemisphere: "northern", areaSqDeg: 132, brightestStarMagnitude: 3.00, difficulty: 3, description: "A small northern constellation representing a triangle, home to the Triangulum Galaxy." },
  { id: "triangulum_australe", name: "Triangulum Australe", hemisphere: "southern", areaSqDeg: 110, brightestStarMagnitude: 1.91, difficulty: 4, description: "Represents a southern triangle, one of twelve constellations introduced by Dutch navigators." },
  { id: "tucana", name: "Tucana", hemisphere: "southern", areaSqDeg: 295, brightestStarMagnitude: 2.85, difficulty: 4, description: "Represents a toucan, home to the Small Magellanic Cloud and the bright globular cluster 47 Tucanae." },
  { id: "vela", name: "Vela", hemisphere: "southern", areaSqDeg: 500, brightestStarMagnitude: 1.83, difficulty: 3, description: "Represents the sails of the ship Argo, part of the ancient constellation Argo Navis." },
  { id: "virgo", name: "Virgo", hemisphere: "southern", areaSqDeg: 1294, brightestStarMagnitude: 0.97, difficulty: 2, description: "The largest zodiac constellation, home to the Virgo Cluster of thousands of galaxies." },
  { id: "volans", name: "Volans", hemisphere: "southern", areaSqDeg: 141, brightestStarMagnitude: 3.61, difficulty: 4, description: "Represents a flying fish, one of twelve constellations introduced by Dutch navigators." },
  { id: "vulpecula", name: "Vulpecula", hemisphere: "northern", areaSqDeg: 268, brightestStarMagnitude: 4.40, difficulty: 4, description: "Represents a small fox, home to the Dumbbell Nebula, one of the first planetary nebulae discovered." },
].map(o => ({ ...o, category: "constellation", color: "#dbe4ff" }))

const existingIds = new Set(dataset.map(o => o.id))
const dupes = NEW_OBJECTS.filter(o => existingIds.has(o.id))
if (dupes.length) {
  console.error("Duplicate ids, aborting:", dupes.map(o => o.id))
  process.exit(1)
}

const updated = [...dataset, ...NEW_OBJECTS]
writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2) + "\n")
console.log(`Added ${NEW_OBJECTS.length} constellations. Dataset now has ${updated.length} objects.`)
