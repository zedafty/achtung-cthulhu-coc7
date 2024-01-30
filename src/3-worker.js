// =============================================================================
// -----------------------------------------------------------------------------
// # Constants
// -----------------------------------------------------------------------------
// =============================================================================

const Sheet = {
	"version" : 1.01
};

// =============================================================================
// -----------------------------------------------------------------------------
// # Functions
// -----------------------------------------------------------------------------
// =============================================================================

function clamp(n, min, max) { // n = number, min = number, max = number ; returns number
	return Math.min(Math.max(n, min), max);
}

function toInt(s) { // s = string ; returns number
	return parseInt(s) || 0;
}

function signInt(n) { // n = number ; returns string
	return n >= 0 ? "+" + n : n.toString();
}

function getLang(s) { // s = string ; returns string
	let r = getTranslationByKey(s);
	return r ? r : "";
}

// =============================================================================
// -----------------------------------------------------------------------------
// # Formulas
// -----------------------------------------------------------------------------
// =============================================================================

/**
	RegExp:
	4
	1d6
	1d6+4
	1d10+1d6
	1d10+1d6+4
	/^(
	[\+\-]?\d+
	|[\+\-]?\d+d\d+
	|[\+\-]?\d+d\d+\s*[\+\-]\s*\d+
	|[\+\-]?\d+d\d+\s*[\+\-]\s*\d+d\d+
	|[\+\-]?\d+d\d+\s*[\+\-]\s*\d+d\d+\s*[\+\-]\s*\d+
	)$/i
*/

const Formulas = {
	"int" : /^([\+\-]?\d+)$/,
	"pts" : /^(\d+|\d+\s*[\+\-]\s*\d+)$/,
	"rng" : /^([\+\-]?\d+|[\+\-]?\d+\s*[\+\-\*\/]\s*\d+|str\s*[\+\-\*\/]\s*\d+)$/,
	"dmg" : /^([\+\-]?\d+|[\+\-]?\d+d\d+|[\+\-]?\d+d\d+\s*[\+\-]\s*\d+|[\+\-]?\d+d\d+\s*[\+\-]\s*\d+d\d+|[\+\-]?\d+d\d+\s*[\+\-]\s*\d+d\d+\s*[\+\-]\s*\d+)$/,
	"dmg-bon" : /^([\+\-]?\d+|[\+\-]?\d+d\d+)$/,
	"spl-cost" : /^([\+\-]?\d+|[\+\-]?\d+d\d+|[\+\-]?\d+d\d+\s*[\+\-]\s*\d+)$/
};

const testFormula = function(s, k) { // s = string, k = key ; returns boolean
	s = s.trim().toLowerCase();
	let r = Formulas[k];
	return r.test(s) ? true : false;
};

const formatFormula = function(s, k) { // s = string, k = key ; returns string
	s = s.trim().toLowerCase();
	let r = Formulas[k];
	return r.test(s) ? s.replace(/^\+/, "").replace(/^[0]+([1-9])+/, "$1").replaceAll(" ", "") : "0";
};

const evalMaxFormula = function(s) { // s = string ; returns number
	let n = 0;
	let r = /^([\+\-]?\d+|[\+\-]?\d+d\d+|[\+\-]?\d+d\d+[\+\-]\d+|[\+\-]?\d+d\d+[\+\-]\d+d\d+|[\+\-]?\d+d\d+[\+\-]\d+d\d+[\+\-]\d+)$/i;
	if (r.test(s)) {
		s = s.replaceAll("d", "*");
		n = eval(s);
	}
	return n;
};

// =============================================================================
// -----------------------------------------------------------------------------
// # Identifiers
// -----------------------------------------------------------------------------
// =============================================================================

const setUniqueIdentifier = function(k) {
	getAttrs([k + "uid"], v => {
		if (v[k + "uid"] === undefined || v[k + "uid"] == "") {
			let u = {};
			u[k + "uid"] = k;
			setAttrs(u, {"silent" : true});
		}
	});
};

// =============================================================================
// -----------------------------------------------------------------------------
// # Roll Difficulty
// -----------------------------------------------------------------------------
// =============================================================================

const checkRollDifficulty = function(e) { // e = event
	let u = {};
	if (e.newValue == "1") {
		if (e.sourceAttribute == "roll-hard") {
			u["roll-extreme"] = 0;
			u["roll-type"] = 1;
		} else {
			u["roll-hard"] = 0;
			u["roll-type"] = 2;
		}
		u["roll-regular"] = 0;
	} else {
		u["roll-regular"] = 1;
		u["roll-type"] = 0;
	}
	setAttrs(u, {"silent" : true});
};

on("change:roll-hard change:roll-extreme", function(e) { // e = event
	checkRollDifficulty(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Dice Bonus/Penalty
// -----------------------------------------------------------------------------
// =============================================================================

const checkDiceBonusPenalty = function(e) { // e = event
	let u = {};
	if (e.newValue == "1") {
		if (e.sourceAttribute == "roll-bonus") {
			u["roll-penalty"] = 0;
			u["roll-dice"] = "bonus";
			u["roll-keep"] = "kl1";
		} else {
			u["roll-bonus"] = 0;
			u["roll-dice"] = "penalty";
			u["roll-keep"] = "k1";
		}
		u["roll-num"] = 2;
	} else {
		u["roll-num"] = 1;
	}
	u["roll-bonus-x2"] = 0;
	u["roll-bonus-x3"] = 0;
	u["roll-penalty-x2"] = 0;
	u["roll-penalty-x3"] = 0;
	setAttrs(u, {"silent" : true});
};

on("change:roll-bonus change:roll-penalty", function(e) { // e = event
	checkDiceBonusPenalty(e);
});

const checkDiceExtraBonusPenalty = function(e) { // e = event
	let u = {};
	let k = e.sourceAttribute.split("-")[1];
	if (e.newValue == "1") {
		if (e.sourceAttribute == `roll-${k}-x2`) {
			u[`roll-${k}-x3`] = 0;
			u["roll-num"] = 3;
		} else {
			u[`roll-${k}-x2`] = 0;
			u["roll-num"] = 4;
		}
	} else {
		u["roll-num"] = 2;
	}
	u["roll-dice"] = k == "bonus" ? "bonus" : "penalty";
	u["roll-keep"] = k == "bonus" ? "kl1" : "k1";
	setAttrs(u, {"silent" : true});
};

on("change:roll-bonus-x2 change:roll-bonus-x3 change:roll-penalty-x2 change:roll-penalty-x3", function(e) { // e = event
	checkDiceExtraBonusPenalty(e);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Whisper to GM
// -----------------------------------------------------------------------------
// =============================================================================

on("change:wgm-toggle", function(e) { // e = event
	let u = {};
	if (e.newValue == "1") {
		u["wgm"] = "/w gm";
	} else {
		u["wgm"] = "";
	}
	setAttrs(u, {"silent" : true});
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Chat Name
// -----------------------------------------------------------------------------
// =============================================================================

const updateChatName = function() {
	getAttrs(["sheet-type", "char-name", "mons-name", "mons-depiction", "show-depiction"], v => {
		let u = {};
		if (toInt(v["sheet-type"]) < 4) u["chat-name"] = v["char-name"];
		else u["chat-name"] = v["show-depiction"] == "1" ? v["mons-depiction"] : v["mons-name"];
		setAttrs(u, {"silent" : true});
	});
};

on("change:sheet-type change:char-name change:mons-name change:mons-depiction change:show-depiction", function() {
	updateChatName();
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Skills
// -----------------------------------------------------------------------------
// =============================================================================

const Skills = {
	"base" : ["accounting", "anthropology", "appraise", "archaeology", "charm", "climb", "credit-rating", "cthulhu-mythos", "disguise", "dodge", "drive-auto", "electrical-repair", "fast-talk", "fighting-brawl", "firearms-handgun", "firearms-rifle-shotgun", "first-aid", "history", "intimidate", "jump", "language-own", "law", "library-use", "listen", "locksmith", "mechanical-repair", "medicine", "natural-world", "navigate", "occult", "operate-heavy-machinery", "persuade", "psychology", "psychoanalysis", "ride", "sleight-of-hand", "spot-hidden", "stealth", "survival", "swim", "throw", "track"],
	"uncommon" : ["animal-handling", "diving", "hypnosis", "read-lips"],
	"specialisations" : ["artcraft-acting", "artcraft-fine-art", "artcraft-forgery", "artcraft-photography", "fighting-axe", "fighting-chainsaw", "fighting-flail", "fighting-garrote", "fighting-spear", "fighting-sword", "fighting-whip", "firearms-bow", "firearms-flamethrower", "firearms-heavy-weapon", "firearms-machine-gun", "firearms-submachine-gun", "language-other1", "language-other2", "language-other3", "language-other4", "language-other5", "language-other6", "pilot-aircraft", "pilot-boat", "science-astronomy", "science-biology", "science-botany", "science-chemistry", "science-cryptography", "science-enginnering", "science-forensics", "science-geology", "science-mathematics", "science-meteorology", "science-pharmacy", "science-physics"],
	"custom" : ["artcraft-custom1", "artcraft-custom2", "fighting-custom1", "fighting-custom2", "firearms-custom1", "firearms-custom2", "pilot-custom1", "pilot-custom2", "science-custom1", "science-custom2", "skill-custom1", "skill-custom2", "skill-custom3", "skill-custom4", "skill-custom5"],
	"achtung" : ["aeronautical-systems", "artillery", "combat-engineer", "command", "comptography", "damage-control", "demolitions", "drive-tracked", "espionage", "fieldcraft", "folklore", "institutional-lore", "jury-rig", "military-doctrine", "parachute", "perform", "photo-interpretation", "radio-operator", "ride-motorcycle", "rifle-grenade", "rope-use", "sabotage", "scrounge", "ski", "spotter", "surgery", "tactics", "teach", "telephony", "theology", "torpedo"],
	"pulp" : ["clairvoyance", "divination", "medium", "psychometry", "telekinesis", "lore-1", "lore-2", "lore-3", "lore-4"]
};

const SkillsHeaders = ["artcraft", "fighting", "firearms", "language", "lore", "pilot", "science"];

const SkillsDefaults = {"accounting" : 5, "aeronautical-systems" : 1, "animal-handling" : 5, "anthropology" : 1, "appraise" : 5, "archaeology" : 1, "artcraft-acting" : 5, "artcraft-fine-art" : 5, "artcraft-forgery" : 5, "artcraft-photography" : 5, "artcraft-custom1" : 5, "artcraft-custom2" : 5, "artillery" : 1, "charm" : 15, "clairvoyance" : 0, "climb" : 20, "combat-engineer" : 15, "command" : 5, "comptography" : 1, "credit-rating" : 0, "cthulhu-mythos" : 0, "damage-control" : 15, "demolitions" : 1, "disguise" : 5, "divination" : 0, "diving" : 1, "dodge" : 0, "drive-auto" : 20, "drive-tracked" : 10, "electrical-repair" : 10, "espionage" : 1, "fast-talk" : 5, "fieldcraft" : 5, "fighting-axe" : 15, "fighting-brawl" : 25, "fighting-chainsaw" : 10, "fighting-flail" : 10, "fighting-garrote" : 15, "fighting-spear" : 20, "fighting-sword" : 20, "fighting-whip" : 5, "fighting-custom1" : 1, "fighting-custom2" : 1, "firearms-bow" : 15, "firearms-flamethrower" : 10, "firearms-handgun" : 20, "firearms-heavy-weapon" : 10, "firearms-machine-gun" : 10, "firearms-rifle-shotgun" : 25, "firearms-submachine-gun" : 15, "firearms-custom1" : 1, "firearms-custom2" : 1, "first-aid" : 30, "folklore" : 5, "history" : 5, "hypnosis" : 1, "institutional-lore" : 1, "intimidate" : 15, "jump" : 20, "jury-rig" : 25, "language-other1" : 1, "language-other2" : 1, "language-other3" : 1, "language-other4" : 1, "language-other5" : 1, "language-other6" : 1, "language-own" : 0, "law" : 5, "library-use" : 20, "listen" : 20, "locksmith" : 1, "lore-1" : 0, "lore-2" : 0, "lore-3" : 0, "lore-4" : 0, "mechanical-repair" : 10, "medicine" : 1, "medium" : 0, "military-doctrine" : 5, "natural-world" : 10, "navigate" : 10, "occult" : 5, "operate-heavy-machinery" : 1, "parachute" : 1, "perform" : 5, "persuade" : 10, "photo-interpretation" : 1, "pilot-aircraft" : 1, "pilot-boat" : 1, "pilot-custom1" : 1, "pilot-custom2" : 1, "psychoanalysis" : 1, "psychology" : 10, "psychometry" : 0, "radio-operator" : 1, "read-lips" : 1, "ride" : 5, "ride-motorcycle" : 15, "rifle-grenade" : 15, "rope-use" : 10, "sabotage" : 5, "science-astronomy" : 1, "science-biology" : 1, "science-botany" : 1, "science-chemistry" : 1, "science-cryptography" : 1, "science-enginnering" : 1, "science-forensics" : 1, "science-geology" : 1, "science-mathematics" : 1, "science-meteorology" : 1, "science-pharmacy" : 1, "science-physics" : 1, "science-custom1" : 1, "science-custom2" : 1, "scrounge" : 10, "ski" : 5, "sleight-of-hand" : 10, "spot-hidden" : 25, "spotter" : 5, "stealth" : 20, "surgery" : 1, "survival" : 10, "swim" : 20, "tactics" : 1, "teach" : 10, "telekinesis" : 0, "telephony" : 1, "theology" : 5, "throw" : 20, "torpedo" : 1, "track" : 10, "skill-custom1" : 1, "skill-custom2" : 1, "skill-custom3" : 1, "skill-custom4" : 1, "skill-custom5" : 1};

const getAllSkills = function() { // returns array
	let a = Skills;
	let b = [];
	let k;
	for (k in a) b = b.concat(a[k]);
	return b.sort();
};

const computeSkillPoints = function() {
	let a = getAllSkills().map(v => `sk-${v}` + (v == "dodge" || v == "language-own" ? "-lvl" : ""));
	getAttrs(["sk-pts-pool", "sk-pts-base", "sk-pts-occ", "sk-pts-itr", "sk-pts-adv", "sk-pts-tot", ...a], v => {
		let p = v["sk-pts-pool"];
		let t = toInt(v["sk-pts-tot"]);
		let n = 0;
		let u = {};
		a.forEach(o => n += toInt(v[o]));
		// console.log("Current pool is: " + p); // DEBUG
		// console.log("Total skill points is: " + t); // DEBUG
		// console.log("Current skill points is: " + n); // DEBUG
		u["sk-pts-" + p] = toInt(v["sk-pts-" + p]) + (n - t);
		u["sk-pts-tot"] = n;
		setAttrs(u);
	});
};

const computeOccupationSkillPoints = function() {
	getAttrs(["edu", "str", "dex", "app", "pow", "sk-pts-occ-char1", "sk-pts-occ-mult1", "sk-pts-occ-char2", "sk-pts-occ-mult2"], v => {
		let chr1 = toInt(v[v["sk-pts-occ-char1"]]) || 0;
		let mul1 = toInt(v["sk-pts-occ-mult1"]) || 0;
		let chr2 = toInt(v[v["sk-pts-occ-char2"]]) || 0;
		let mul2 = toInt(v["sk-pts-occ-mult2"]) || 0;
		setAttrs({"sk-pts-occ-tot" : chr1 * mul1 + chr2 * mul2});
	});
};

on("change:sk-pts-occ-char1 change:sk-pts-occ-mult1 change:sk-pts-occ-char2 change:sk-pts-occ-mult2", function() {
	computeOccupationSkillPoints();
});

on("change:sk-pts-occ-char2 change:sk-pts-occ-mult2", function(e) {
	if (!e.newValue || e.newValue == "0") {
		let u = {};
		let k = e.sourceAttribute.slice(-5) == "char2" ? "mult2" : "char2";
		u["sk-pts-occ-" + k] = "";
		setAttrs(u);
	}
});

const computeOccupationSkillPointsLeft = function() {
	getAttrs(["sk-pts-occ-tot", "sk-pts-occ"], v => {
		setAttrs({"sk-pts-occ-left" : toInt(v["sk-pts-occ-tot"]) - toInt(v["sk-pts-occ"])});
	});
};

on("change:sk-pts-occ-tot change:sk-pts-occ", function() {
	computeOccupationSkillPointsLeft();
});

const computeInterestsSkillPoints = function() {
	getAttrs(["int", "sk-pts-itr-char", "sk-pts-itr-mult"], v => {
		let chr = toInt(v[v["sk-pts-itr-char"]]) || 0;
		let mul = toInt(v["sk-pts-itr-mult"]) || 0;
		setAttrs({"sk-pts-itr-tot" : chr * mul});
	});
};

on("change:sk-pts-itr-char change:sk-pts-itr-mult", function() {
	computeInterestsSkillPoints();
});

const computeInterestsSkillPointsLeft = function() {
	getAttrs(["sk-pts-itr-tot", "sk-pts-itr"], v => {
		setAttrs({"sk-pts-itr-left" : toInt(v["sk-pts-itr-tot"]) - toInt(v["sk-pts-itr"])});
	});
};

on("change:sk-pts-itr-tot change:sk-pts-itr", function() {
	computeInterestsSkillPointsLeft();
});

const resetSkillPoints = function(f) { // f = callback
	if (f == null) f = function(){};
	let a = SkillsDefaults;
	let o, k;
	let n = 0;
	let u = {};
	let c = [];
	for (o in a) {
		n += a[o];
		k = o + (o == "dodge" || o == "language-own" ? "-lvl" : "");
		u["sk-" + k] = a[o];
		u["sk-" + k + "-half"] = Math.floor(a[o] / 2);
		u["sk-" + k + "-fifth"] = Math.floor(a[o] / 5);
		if (WeaponSkills.includes(k)) c.push(updateWeaponSkill("sk-" + k));
	}
	u["sk-credit-min"] = 0;
	u["sk-credit-max"] = 100;
	u["sk-pts-pool"] = "occ";
	u["sk-pts-base"] = n;
	u["sk-pts-occ"] = 0;
	u["sk-pts-itr"] = 0;
	u["sk-pts-adv"] = 0;
	u["sk-pts-tot"] = n;
	setAttrs(u, {"silent" : true}, function() {
		for (o in c) c[o];
		f();
	});
};

on("clicked:reset-skill-points", function() {
	setAttrs({"data-prompt" : "4"}, {"silent" : true});
});

const clearOccupationSkills = function(f) { // f = callback
	if (f == null) f = function(){};
	let a = getAllSkills(), u = {}, k;
	for (k in a) if (a[k] != "credit-rating") u[`sk-${a[k]}-occ`] = "0";
	setAttrs(u, {"silent" : true}, function() {
		f();
	});
};

on("clicked:clear-occupation-skills", function() {
	setAttrs({"data-prompt" : "5"}, {"silent" : true});
});

const refreshAvailableSkills = function() {
	let a = getAllSkills().concat(SkillsHeaders).map(v => `sk-${v}-avl`);
	getAttrs(a, v => {
		let i = 0;
		let n = 0;
		let o = {
			"artcraft" : 0,
			"fighting" : 0,
			"firearms" : 0,
			"language" : 0,
			"lore" : 0,
			"pilot" : 0,
			"science" : 0
		};
		let k, q, u = {};
		for (i; i < a.length; i++) {
			if (v[a[i]] == "1") {
				q = a[i].replace("sk-", "").replace("-avl", "");
				if (SkillsHeaders.includes(q)) continue; // is header
				n++;
				if (k == "skill") continue; // is custom skill without header
				k = a[i].split("-")[1];
				if (SkillsHeaders.includes(k)) o[k] = 1; // is skill under header
			}
		}
		for (k in o) {
			u["sk-" + k + "-avl"] = o[k];
			if (o[k] == 1) n++;
		}
		u["sk-avl"] = Math.max(Math.ceil(n / 3), 1);
		setAttrs(u);
	})
};

const toggleAvailableSkills = function(s) { // s = skill key
	getAttrs(["sk-" + s], v => {
		let a = Skills[s].map(v => `sk-${v}-avl`);
		let b = v["sk-" + s] == "0" ? "1" : "0";
		let k;
		let u = {};
		for (k in a) u[a[k]] = b;
		u["sk-" + s] = b;
		setAttrs(u);
	});
};

on("change:edit-mode", function(e) { // e = event
	if (e.newValue == "0") refreshAvailableSkills();
});

on("clicked:refresh-skill-grid", function() {
	refreshAvailableSkills();
});

on("clicked:toggle-base clicked:toggle-uncommon clicked:toggle-specialisations clicked:toggle-custom clicked:toggle-achtung clicked:toggle-pulp", function(e) { // e = event
	toggleAvailableSkills(e.triggerName.split("-")[1]);
});

const updateSkillTotal = function(k) {
	getAttrs([k + "-base", k + "-lvl"], v => {
		let u = {};
		u[k] = toInt(v[k + "-base"]) + toInt(v[k + "-lvl"]);
		setAttrs(u);
	});
};

on("change:sk-dodge-base change:sk-dodge-lvl change:sk-language-own-base change:sk-language-own-lvl", function(e) { // e = event
	updateSkillTotal(e.sourceAttribute.replace(/-(base|lvl)/, ""), e.newValue);
});

on("change:sk-fighting-custom1-name change:sk-fighting-custom2-name change:sk-firearms-custom1-name change:sk-firearms-custom2-name", function(e) { // e = event
	let k = e.sourceAttribute.slice(0,-5);
	getSectionIDs("weapons", function(ids) {
		let a = [];
		ids.forEach(o => a.push(`repeating_weapons_${o}_skill`));
		getAttrs(a, v => {
			a.forEach(o => {
				if (v[o] == k) {
					let u = {};
					getAttrs([v[o] + "-name"], q => {
						u[o + "-txt"] = q[v[o] + "-name"];
						setAttrs(u, {"silent" : true});
					});
				}
			});
		});
	});
});

const updateCreditRating = function() {
	getAttrs(["sk-credit-rating", "sk-credit-min", "sk-credit-max"], v => {
		let r = toInt(v["sk-credit-rating"]);
		let n = toInt(v["sk-credit-min"]);
		let m = toInt(v["sk-credit-max"]);
		if (r < n) setAttrs({"sk-credit-rating" : n});
		else if (r > m) setAttrs({"sk-credit-rating" : m});
	});
};

on("change:sk-credit-min change:sk-credit-max", updateCreditRating);

// =============================================================================
// -----------------------------------------------------------------------------
// # Characteristics
// -----------------------------------------------------------------------------
// =============================================================================

const Characteristics = ["str", "con", "siz", "dex", "app", "edu", "int", "pow", "luck"];

// =============================================================================
// -----------------------------------------------------------------------------
// # Attributes
// -----------------------------------------------------------------------------
// =============================================================================

const updateHitPointsMax = function() {
	getAttrs(["con", "siz"], v => {
		setAttrs({"hp_max" : Math.floor((toInt(v["con"]) + toInt(v["siz"])) / 10)});
	});
};

const updatePoints = function(k) { // k = hp, mp or san
	getAttrs([k, k + "_max"], v => {
		let n;
		let s = v[k];
		let r = Formulas["pts"];
		let b = false;
		let u = {};
		if (r.test(s)) {
			n = eval(s);
			u[k] = n;
			b = true;
		} else {
			n = toInt(v[k]);
		}
		let m = toInt(v[k + "_max"]);
		if (n < 0 || n > m) {
			u[k] = n > m ? m : 0;
			b = true;
		}
		if (k == "hp") {
			if (n > m * 0.75) u["health"] = "0";
			else if (n > m * 0.5) u["health"] = "1";
			else if (n > m * 0.25) u["health"] = "2";
			else u["health"] = "3";
		}
		if (b) setAttrs(u, {"silent" : true});
	});
};

const updateDamageBonusAndBuild = function(f) {
	if (f == null) f = function(){};
	getAttrs(["str", "siz"], v => {
		let u;
		let n = toInt(v["str"]) + toInt(v["siz"]);
		if (n > 164) u = {"char-db" : "1d6", "char-bld" : "2"};
		else if (n > 124) u = {"char-db" : "1d4", "char-bld" : "1"};
		else if (n > 84) u = {"char-db" : "0", "char-bld" : "0"};
		else if (n > 64) u = {"char-db" : "-1", "char-bld" : "-1"};
		else u = {"char-db" : "-2", "char-bld" : "-2"};
		setAttrs(u, null, f);
	});
};

const updateMovementRate = function(f) {
	if (f == null) f = function(){};
	getAttrs(["str", "siz", "dex", "age"], v => {
		let str = toInt(v["str"]);
		let siz = toInt(v["siz"]);
		let dex = toInt(v["dex"]);
		let age = toInt(v["age"]);
		let n = 7;
		if (str > siz && dex > siz) n = 9;
		else if (str > siz || dex > siz) n = 8
		if (age >= 80) n -= 5;
		else if (age >= 70) n -= 4;
		else if (age >= 60) n -= 3;
		else if (age >= 50) n -= 2;
		else if (age >= 40) n -= 1;
		setAttrs({"char-move" : n}, null, function() {
			f
		});
	});
};

on("change:age", function() {
	updateMovementRate();
});

on("change:hp_max change:mp_max change:san_max", function(e) { // e = event
	updatePoints(e.sourceAttribute.replace("_max", ""));
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Weapons
// -----------------------------------------------------------------------------
// =============================================================================

on("change:repeating_weapons:name", function(e) { // e = event
	setUniqueIdentifier(e.sourceAttribute.substr(0,39));
});

const CustomFightingSkills = ["fighting-custom1", "fighting-custom2"];
const CustomFirearmsSkills = ["firearms-custom1", "firearms-custom2"];
const FightingSkills = ["fighting-axe", "fighting-brawl", "fighting-chainsaw", "fighting-flail", "fighting-garrote", "fighting-spear", "fighting-sword", "fighting-whip", ...CustomFightingSkills];
const FirearmsSkills = ["firearms-bow", "firearms-flamethrower", "firearms-handgun", "firearms-heavy-weapon", "firearms-machine-gun", "firearms-rifle-shotgun", "firearms-submachine-gun", ...CustomFirearmsSkills];
const WeaponSkills = [...FightingSkills, ...FirearmsSkills, "artillery", "demolitions", "throw"];

const updateWeaponSkill = function(k) {
	getSectionIDs("weapons", function(ids) {
		let a = [];
		ids.forEach(o => a.push(`repeating_weapons_${o}_skill`));
		getAttrs(a, v => {
			a.forEach(o => {
				if (v[o] == k) {
					getAttrs([v[o], v[o] + "-half", v[o] + "-fifth"], q => {
						let u = {};
						u[o + "-val"] = q[v[o]];
						u[o + "-half"] = q[v[o] + "-half"];
						u[o + "-fifth"] = q[v[o] + "-fifth"];
						setAttrs(u, {"silent" : true});
					});
				}
			});
		});
	});
};

const updateWeaponSkillName = function(f) { // f = callback
	if (f == null) f = function(){};
	getSectionIDs("weapons", function(ids) {
		let a = [];
		let b = [...CustomFightingSkills, ...CustomFirearmsSkills].map(v => "sk-" + v + "-name");
		ids.forEach(o => a.push(`repeating_weapons_${o}_skill`));
		getAttrs(a.concat(b), v => {
			let c, u = {};
			a.forEach(o => {
				c = v[o].substr(0, v[o].length-1).endsWith("custom");
				u[o + "-txt"] = c ? v[v[o] + "-name"] : getLang(v[o]) || "—";
			});
			setAttrs(u, {"silent" : true}, function() {
				f();
			});
		});
	});
};

on("change:repeating_weapons:skill", function(e) { // e = event
	let k = e.newValue;
	let a = [k, k + "-half", k + "-fifth"];
	let b = false;
	if (k.substr(0, k.length-1).endsWith("custom")) {
		a.push(k + "-name");
		b = true;
	}
	getAttrs(a, v => {
		setAttrs({
			"repeating_weapons_skill-val" : v[k] || 1,
			"repeating_weapons_skill-half" : v[k + "-half"] || 1,
			"repeating_weapons_skill-fifth" : v[k + "-fifth"] || 1,
			"repeating_weapons_skill-txt" : b ? v[k + "-name"] : getLang(e.newValue) || "—"
		});
	});
});

on("change:repeating_weapons:dmg", function(e) { // e = event
	let s = e.newValue;
	let k = "repeating_weapons_";
	let r = /^(.*)\s*\/\s*(\d+)\s*(m|y|yd)$/i; // dmg-rng regexp
	let u = {};
	if (r.test(s)) { // has damage radius
		let q = s.match(r);
		let t = q[3] == "m" ? " m" : (q[3] == "yd" ? "y" : q[3]);
		s = formatFormula(q[1], "dmg");
		u[k + "dmg"] = s + "/" + q[2] + t;
		u[k + "dmg-val"] = s;
		u[k + "dmg-rng-n"] = q[2];
		u[k + "dmg-rng-u"] = q[3] == "y" ? "yd" : q[3];
	} else { // no damage radius
		s = formatFormula(s, "dmg");
		u[k + "dmg"] = s;
		u[k + "dmg-val"] = s;
		u[k + "dmg-rng-n"] = "0";
		u[k + "dmg-rng-u"] = "y";
	}
	u[k + "imp"] = evalMaxFormula(s);
	setAttrs(u, {"silent" : true});
});

const updateWeaponRange = function(id, f) { // id = repeating attribute id, f = callback
	if (f == null) f = function(){};
	getSectionIDs("weapons", function(ids) {
		let a = ["str"], b = [];
		ids.forEach(o => {
			if (id == null || id == o) {
				a.push(`repeating_weapons_${o}_rng-txt`);
				a.push(`repeating_weapons_${o}_rng-n`);
				a.push(`repeating_weapons_${o}_rng-u`);
				b.push(o);
			}
		});
		getAttrs(a, v => {
			let u = {};
			let c = getLang("str-bb");
			let g = c.toLowerCase();
			let s, n, r, k;
			b.forEach(o => {
				k = `repeating_weapons_${o}_`;
				s = id == null ? v[k + "rng-n"] : v[k + "rng-txt"];
				s = s.toString().toLowerCase();
				n = -1;
				r = "—";
				if (!(/^[\+\-]*\d+$/).test(s)) {
					s = s.replace(/[×x]/i, "*").replace("÷", "/");
					s = s.replace(g, "str");
					s = formatFormula(s, "rng");
					if (s == "0") {
						u[k + "rng-n"] = 0;
						u[k + "rng-txt"] = getLang("lng-error");
					} else {
						u[k + "rng-n"] = s;
						u[k + "rng-txt"] = s.replace("*", "×").replace("/", "÷").replace("str", c);
						n = Math.max(0, Math.round(eval(s.replace("str", toInt(v["str"])))));
					}
				} else {
					n = toInt(v[k + "rng-txt"]);
				}
				if (n == 0) r = getLang("wpn-rng-touch");
				else if (n > 0) r = n + " " + getLang("u-" + v[k + "rng-u"]);
				u[k + "rng"] = r;
			});
			setAttrs(u, {"silent" : true}, function() {
				f();
			});
		});
	});
};

on("change:repeating_weapons:rng-txt change:repeating_weapons:rng-u", function(e) { // e = event
	updateWeaponRange(e.sourceAttribute.substr(18,20));
});

const updateWeaponAmmo = function(k) { // k = repeating key
	getAttrs([k + "ammo", k + "ammo_max"], v => {
		let n = toInt(v[k + "ammo"]);
		let m = toInt(v[k + "ammo_max"]);
		let u = {};
		if (n > m) n = m;
		u[k + "ammo"] = Math.max(n, 0);
		u[k + "ammo_max"] = Math.max(m, 0);
		setAttrs(u, {"silent" : true});
	});
};

on("change:repeating_weapons:ammo", function(e) { // e = event
	updateWeaponAmmo(e.sourceAttribute.substr(0,39));
});

const updateWeaponDamageBonus = function(k) { // k = repeating key
	getAttrs(["char-db", k + "db", k + "db-half"], v => {
		let u = {};
		let s = v["char-db"]
		if (v[k + "db"] == "0") {
			u[k + "db-half"] = "0";
			s = "0";
		} else if (v[k + "db-half"] == "1") {
			s = "floor(" + s + "/2)";
		}
		u[k + "db-val"] = s;
		setAttrs(u);
	});
};

on("change:repeating_weapons:db change:repeating_weapons:db-half", function(e) { // e = event
	updateWeaponDamageBonus(e.sourceAttribute.substr(0,39));
});

on("change:repeating_weapons:malf", function(e) { // e = event
	let n = toInt(e.newValue);
	let u = {};
	if (n < 1 || n > 100) {
		u["repeating_weapons_malf"] = 0;
		u["repeating_weapons_malf-val"] = 101;
		u["repeating_weapons_malf-txt"] = "—";
	} else {
		u["repeating_weapons_malf-val"] = n;
		u["repeating_weapons_malf-txt"] = n;
	}
	setAttrs(u, {"silent" : true});
});

const updateWeaponDamage = function() {
	getSectionIDs("weapons", function(ids) {
		let a = ["char-db"];
		let b = [];
		ids.forEach(o => {
			a.push(`repeating_weapons_${o}_db`);
			b.push(`repeating_weapons_${o}_db-half`);
		});
		getAttrs(a.concat(b), v => {
			let u = {};
			a.forEach(o => {
				if (v[o + "-half"] == "1") {
					u[o + "-val"] = "floor(" + v["char-db"] + "/2)";
				} else if (v[o] == "1") {
					u[o + "-val"] = v["char-db"];
				} else {
					u[o + "-val"] = 0;
				}
			});
			setAttrs(u, {"silent" : true});
		});
	});
};

on("change:char-db", function(e) { // e = event
	let s = formatFormula(e.newValue, "dmg-bon");
	setAttrs({"char-db" : s}, {"silent" : true}, updateWeaponDamage);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Spells
// -----------------------------------------------------------------------------
// =============================================================================

on("change:repeating_spells:cost-mp change:repeating_spells:cost-san", function(e) { // e = event
	let s = formatFormula(e.newValue, "spl-cost");
	let k = e.sourceAttribute.substr(38);
	let u = {};
	u[`repeating_spells_${k}`] = s;
	setAttrs(u, {"silent" : true});
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Monster
// -----------------------------------------------------------------------------
// =============================================================================

on("change:repeating_attacks:name", function(e) { // e = event
	setUniqueIdentifier(e.sourceAttribute.substr(0,39));
});

on("change:mons-dodge change:repeating_attacks:score", function(e) { // e = event
	let k = e.sourceAttribute;
	let n = toInt(e.newValue);
	let u = {};
	u[k + "-half"] = Math.floor(n / 2);
	u[k + "-fifth"] = Math.floor(n / 5);
	setAttrs(u);
});

const updateAttackDamageBonus = function(k) { // k = repeating key
	getAttrs(["mons-db", k + "db"], v => {
		let u = {};
		let s = v["mons-db"]
		if (v[k + "db"] == "0") s = "0";
		u[k + "db-val"] = s;
		setAttrs(u);
	});
};

on("change:repeating_attacks:db", function(e) { // e = event
	updateAttackDamageBonus(e.sourceAttribute.substr(0,39));
});

const updateAttackOpposedCheck = function(id) { // id = repeating key id
	getSectionIDs("attacks", function(ids) {
		let a = ["str", "con", "siz", "dex", "int", "pow"], b = [];
		ids.forEach(o => {
			if (id == null || id == o) {
				a.push(`repeating_attacks_${o}_opp-chk`);
				a.push(`repeating_attacks_${o}_opp-own`);
				b.push(o);
			}
		});
		getAttrs(a, v => {
			let u = {};
			let k;
			b.forEach(o => {
				k = `repeating_attacks_${o}_`;
				if (v[k + "opp-chk"] == "1") {
					u[k + "score"] = v[k + "opp-own"] == "" ? "0" : v[v[k + "opp-own"]];
				} else if (v[k + "opp-own"] != "") {
					u[k + "score"] = v[v[k + "opp-own"]];
				}
			});
			setAttrs(u, {"silent" : true});
		});
	});
};

on("change:repeating_attacks:type", function(e) { // e = event
	setAttrs({"repeating_attacks_opp-chk" : e.newValue == "atk-type-opposed" ? "1" : "0"});
});

on("change:repeating_attacks:opp-chk change:repeating_attacks:opp-own", function(e) { // e = event
	updateAttackOpposedCheck(e.sourceAttribute.substr(18,20));
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Ratios
// -----------------------------------------------------------------------------
// =============================================================================

const updateRatio = function(k, s) { // k = attr key, s = attr value
	let n;
	let f = function(){};
	let u = {};
	if (k == "luck") {
		let r = Formulas["pts"];
		if (r.test(s)) {
			n = eval(s);
			u[k] = n;
		}
	}
	if (n == null) n = toInt(s);
	getAttrs(["sheet-type"], v => {
		if (n < 0 || (toInt(v["sheet-type"]) <= 2 && n > 99)) {
			let m = Characteristics.includes(k) ? 100 : 99;
			u[k] = clamp(n, 0, m);
		} else {
			u[k + "-half"] = Math.floor(n / 2);
			u[k + "-fifth"] = Math.floor(n / 5);
			switch(k) {
				case "str" : f = updateDamageBonusAndBuild(updateMovementRate(updateWeaponRange())); break;
				case "siz" : f = updateDamageBonusAndBuild(updateMovementRate(updateHitPointsMax())); break;
				case "con" : f = updateHitPointsMax(); break;
				case "dex" : f = updateMovementRate(); u["sk-dodge-base"] = Math.max(Math.floor(n / 2), 1); break;
				case "edu" : u["sk-language-own-base"] = n; break;
				case "pow" : u["mp_max"] = Math.floor(n / 5); break;
				case "sk-credit-rating" : f = updateCreditRating();
			}
			if (WeaponSkills.includes(k.substr(3))) f = updateWeaponSkill(k);
		}
		setAttrs(u, null, function() {
			if (k.startsWith("sk-")) computeSkillPoints();
			if (["edu", "str", "dex", "app", "pow"].includes(k)) computeOccupationSkillPoints();
			if (["str", "con", "siz", "dex", "int", "pow"].includes(k)) updateAttackOpposedCheck();
			if (k == "int") computeInterestsSkillPoints();
			f;
		});
	});
};

on(Characteristics.map(v => "change:" + v).join(" "), function(e) { // e = event
	updateRatio(e.sourceAttribute, e.newValue);
});

on(getAllSkills().map(v => "change:sk-" + v).join(" "), function(e) { // e = event
	updateRatio(e.sourceAttribute, e.newValue);
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Dropdowns
// -----------------------------------------------------------------------------
// =============================================================================

const Dropdowns = ["char-activity", "char-earnings", "char-armed-service", "char-initial-rank", "repeating_weapons:type", "repeating_attacks:type", "repeating_attacks:opp-own", "repeating_attacks:opp-tar", "repeating_talents:type"];

const updateDropdownTexts = function(f) {
	let a = [];
	if (typeof f !== "function") f = function(){};
	Dropdowns.forEach(o => {
		if (!o.startsWith("repeating_")) {
			a.push(o);
		}
	});
	getSectionIDs("weapons", function(ids) {
		ids.forEach(q => a.push(`repeating_weapons_${q}_type`));
		getSectionIDs("attacks", function(ids) {
			ids.forEach(q => {
				a.push(`repeating_attacks_${q}_type`);
				a.push(`repeating_attacks_${q}_opp-own`);
				a.push(`repeating_attacks_${q}_opp-tar`);
			});
			getSectionIDs("talents", function(ids) {
				ids.forEach(q => a.push(`repeating_talents_${q}_type`));
				getAttrs(a, v => {
					let u = {};
					a.forEach(q => u[q + "-txt"] = v[q] == "" ? "—" : getLang(v[q]) || "—");
					setAttrs(u, {"silent" : true}, f);
				});
			});
		});
	});
};

const updateDropdownText = function(k, v) { // k = attr key, v = attr value
	let u = {};
	u[k + "-txt"] = v == null ? "—" : getLang(v) || "—";
	return u;
};

on(Dropdowns.map(v => "change:" + v).join(" "), function(e) { // e = event
	setAttrs(updateDropdownText(e.sourceAttribute, e.newValue));
});

// =============================================================================
// -----------------------------------------------------------------------------
// # Language
// -----------------------------------------------------------------------------
// =============================================================================

const updateCharacterSheetLanguage = function() {
	updateDropdownTexts(function() {
		updateWeaponSkillName(function() {
			updateWeaponRange(null, function() {
				console.info("Achtung! Cthulhu (Coc 7th) Character Sheet language reloaded");
			});
		});
	});
};

on("clicked:reload-translation", updateCharacterSheetLanguage);

// =============================================================================
// -----------------------------------------------------------------------------
// # Modal
// -----------------------------------------------------------------------------
// =============================================================================

const closeModal = function() {
		setAttrs({
		"data-drop" : "",
		"data-name" : "",
		"data-prompt" : "0",
		"data-choice1" : "",
		"data-choice2" : "",
		"data-choice3" : "",
		"data-choice4" : "",
		"data-buffer" : "",
		"settings" : "0"
	}, {"silent" : true});
};

on("clicked:modal-close", closeModal);

// =============================================================================
// -----------------------------------------------------------------------------
// # Compendium
// -----------------------------------------------------------------------------
// =============================================================================

const checkValue = function(s, f) { // s = string, f = format ("num" or "none")
	return s != null ? s : (f == "num" ? "0" : (f == "none" ? "" : "—"));
};

const formatWeaponSkill = function (s) { // s = compendium data string ; returns string
	s = s.trim().toLowerCase().replace(/[\(\)/]/g, "").replace(/\s+/g, "-");
	if (s == "firearms-heavy") s = "firearms-heavy-weapon"; // WARNING : assmued value (no reference)
	else if (s.endsWith("mg")) s = "firearms-machine-gun";
	else if (s.endsWith("mg")) s = "firearms-submachine-gun";
	if (WeaponSkills.includes(s)) return "sk-" + s;
	return "";
};

/**
	NOTE
	On shotguns, with multiple range and damage, the Compendium shows:
	Range like "10/20/50 yards"
	But Damage like "1D6"
	It seems choice was made to keep the lowest damage,
	Which means the higher range.
*/
const handleItemData = function(o, name) { // o = compendium data, name = string
	let cat = o["subcategory"];
	let mag = [];
	let u = {};
	if (cat == "Weapon") {
		if (o["ammo"] != null) {
			let s = o["ammo"];
			let r = s.match(/\d+/g);
			let i;
			if (r != null) for (i = 0; i < r.length; i++) {
				mag.push(r[i]); // multiple magazine contenances
				u["data-choice" + (i + 1)] = r[i];
			}
			else if ((/(one|only)/i).test(s)) mag.push("1");
			u["data-buffer"] = JSON.stringify(mag);
		}
	}
	if (mag.length > 1) u["data-prompt"] = "3";
	setAttrs(u, {"silent" : true}, function() {
		if (!Object.hasOwn(u, "data-prompt")) importItemData(o, name, 0);
	});
};

const importItemData = function(o, name, idx) { // o = compendium data, name = string, idx = number
	getAttrs(["data-buffer"], v => {
		let u1 = {}, u2 = {}, id, desc = [], cat = o["subcategory"];
		if (cat == "Weapon") {
			id = generateRowID();
			u1["tab"] = "3";
			u2["repeating_weapons_" + id + "_name"] = checkValue(name); // update uid
			u2["repeating_weapons_" + id + "_dmg"] = formatFormula(checkValue(o["damage"], "num"), "dmg"); // update dmg
			u1["repeating_weapons_" + id + "_dmg-val"] = u2["repeating_weapons_" + id + "_dmg"];
			if (o["skill"] != null) {
				u2["repeating_weapons_" + id + "_skill"] = formatWeaponSkill(o["skill"]); // update dropdown and get value
			}
			if (o["range"] != null) {
				let s = o["range"].toLowerCase();
				let n = -1; // digit
				let r = s.match(/\d+/g);
				let u = s.includes("feet") ? "ft" : "yd";
				if (s.includes("touch")) n = 0; // zero range
				else if (s.includes("str")) n = o["range"].replace(/\s*(feet|yard)s*\s*/, "");
				else if (r != null) n = r[r.length - 1]; // higher range
				u2["repeating_weapons_" + id + "_rng-txt"] = n;
				u1["repeating_weapons_" + id + "_rng-n"] = n;
				u1["repeating_weapons_" + id + "_rng-u"] = u;
				if (r != null && r.length > 1) { // if multiple ranges and damage, append data string to description
					desc.push(getLang("wpn-rng") + getLang("lng-colon") + o["range"]);
				}
			}
			u1["repeating_weapons_" + id + "_rof"] = checkValue(o["attacks"]);
			if (o["ammo"] != null) {
				if (idx > 0) idx -= 1;
				let n = toInt(JSON.parse(v["data-buffer"])[idx]);
				u1["repeating_weapons_" + id + "_ammo"] = n;
				u1["repeating_weapons_" + id + "_ammo_max"] = n;
			}
			u2["repeating_weapons_" + id + "_malf"] = checkValue(o["malfunction"], "num");
			if (o["damage_bonus"] != null) {
				let s = o["damage_bonus"].toLowerCase();
				if (s == "full") {
					u2["repeating_weapons_" + id + "_db"] = "1";
				} else if (s == "half") {
					u1["repeating_weapons_" + id + "_db"] = "1";
					u2["repeating_weapons_" + id + "_db-half"] = "1";
				}
			}
			if (o["impale_bonus"] != null) {
				u1["repeating_weapons_" + id + "_impale"] = o["impale_bonus"].toLowerCase() == "true" ? "1" : "0";
			}
			if (o["common_in_era"] != null) {
				let s = o["common_in_era"];
				if (s.includes("1920")) u1["repeating_weapons_" + id + "_common-1920"] = "1";
				if (s.includes("modern")) u1["repeating_weapons_" + id + "_common-modern"] = "1";
			}
			if (o["cost"] != null) {
				let q = JSON.parse(o["cost"]);
				if (q.hasOwnProperty("1920")) {
					u1["repeating_weapons_" + id + "_common-1920"] = "1";
					u1["repeating_weapons_" + id + "_cost-1920"] = q["1920"];
				}
				if (q.hasOwnProperty("modern")) {
					u1["repeating_weapons_" + id + "_common-modern"] = "1";
					u1["repeating_weapons_" + id + "_cost-modern"] = q["modern"];
				}
			}
			if (o["description"] != null) {
				let s = checkValue(o["description"]);
				if (s != "—") desc.push(s);
			}
			u1["repeating_weapons_" + id + "_desc"] = desc.length > 0 ? desc.join("\n") : "—";
			u1["repeating_weapons_" + id + "_show-option"] = "1";
		} else if (cat.includes("Ammunition") || cat.includes("Gadget")) {
			id = generateRowID();
			u1["tab"] = "5";
			u1["repeating_gear_" + id + "_name"] = checkValue(name);
			u1["repeating_gear_" + id + "_type"] = getLang("itm-type-" + (cat.includes("Ammunition") ? "ammo" : "gadget"));
			if (o["cost"] != null) {
				let q = JSON.parse(o["cost"]);
				if (q.hasOwnProperty("1920")) {
					u1["repeating_gear_" + id + "_common-1920"] = "1";
					u1["repeating_gear_" + id + "_cost-1920"] = q["1920"];
				}
				if (q.hasOwnProperty("modern")) {
					u1["repeating_gear_" + id + "_common-modern"] = "1";
					u1["repeating_gear_" + id + "_cost-modern"] = q["modern"];
				}
			}
			u1["repeating_gear_" + id + "_desc"] = checkValue(o["description"]);
			u1["repeating_gear_" + id + "_show-option"] = "1";
		}
		setAttrs(u1, {"silent" : true}, function() {
			setAttrs(u2, null, closeModal);
		});
	});
};

const importMonsterData = function(o, name) { // o = compendium data, name = string
	let u1 = {}, u2 = {}, q, i, t, id;
	let a = {
		"strength" : "str",
		"constitution" : "con",
		"size" : "siz",
		"dexterity" : "dex",
		"intelligence" : "int",
		"power" : "pow"
	};
	u2["sheet-type"] = "4";
	u1["tab"] = "1";
	u1["mons-name"] = name;
	u1["mons-type"] = checkValue(o["type"]);
	u1["mons-depiction"] = checkValue(o["short_description"]);
	u1["hp"] = formatFormula(checkValue(o["hitpoints"], "num"), "pts");
	u1["hp_max"] = u1["hp"];
	u1["mp"] = formatFormula(checkValue(o["magicpoints"], "num"), "pts");
	u1["mp_max"] = u1["mp"];
	u2["show-magic"] = u1["mp"] != "0" ? "1" : "0";
	u1["mons-san-loss"] = checkValue(o["sanity_loss"]);
	u1["mons-skills"] = checkValue(o["skills"]);
	u1["mons-spells-known"] = checkValue(o["spells_known"]);
	u1["mons-dodge"] = formatFormula(checkValue(o["dodge"], "num"), "int");
	u1["mons-bld"] = formatFormula(checkValue(o["build"], "num"), "int");
	u1["mons-db"] = formatFormula(checkValue(o["damage_bonus"], "num"), "dmg-bon");
	u1["mons-atk"] = checkValue(o["attacks_per_round"]);
	u1["mons-db-note"] = checkValue(o["damage_bonus_notes"]);
	u1["mons-move"] = checkValue(o["move"]);
	u1["mons-arm"] = checkValue(o["armor"]);
	if (o["characteristics_average"] != null) {
		q = JSON.parse(o["characteristics_average"]);
		u2["str"] = formatFormula(checkValue(q["strength"], "num"), "int");
		u2["con"] = formatFormula(checkValue(q["constitution"], "num"), "int");
		u2["siz"] = formatFormula(checkValue(q["size"], "num"), "int");
		u2["dex"] = formatFormula(checkValue(q["dexterity"], "num"), "int");
		u2["app"] = "0";
		u2["edu"] = "0";
		u2["int"] = formatFormula(checkValue(q["intelligence"], "num"), "int");
		u2["pow"] = formatFormula(checkValue(q["power"], "num"), "int");
		u2["luck"] = "0";
	}
	if (o["special_abilities"] != null) {
		q = JSON.parse(o["special_abilities"]);
		q.forEach(v => {
			id = generateRowID();
			u1["repeating_powers_" + id + "_name"] = checkValue(v["name"]);
			u1["repeating_powers_" + id + "_desc"] = checkValue(v["description"]);
		});
	}
	if (o["combat_attacks"] != null) {
		q = JSON.parse(o["combat_attacks"]);
		q.forEach(v => {
			t = checkValue(v["attack_type"]);
			id = generateRowID();
			u2["repeating_attacks_" + id + "_name"] = checkValue(v["name"]);
			u2["repeating_attacks_" + id + "_score"] = formatFormula(checkValue(v["target"], "num"), "int");
			u2["repeating_attacks_" + id + "_db"] = v["damage_bonus"] != null && v["damage_bonus"] == "full" ? "1" : "0";
			u2["repeating_attacks_" + id + "_dmg"] = formatFormula(checkValue(v["damage"], "num"), "dmg");
			u1["repeating_attacks_" + id + "_dmg-alt"] = checkValue(v["alt_damage"], "none");
			u2["repeating_attacks_" + id + "_type"] = t != "—" ? "atk-type-" + t : "";
			u1["repeating_attacks_" + id + "_desc"] = checkValue(v["description"], "none");
			if (t == "opposed") {
				u2["repeating_attacks_" + id + "_opp-own"] = a[checkValue(v["own_characteristic"])];
				u2["repeating_attacks_" + id + "_opp-tar"] = a[checkValue(v["target_characteristic"])];
			}
		});
	}
	if (o["combat_abilities"] != null) {
		q = JSON.parse(o["combat_abilities"]);
		q.forEach(v => {
			id = generateRowID();
			u1["repeating_abilities_" + id + "_name"] = checkValue(v["name"]);
			u1["repeating_abilities_" + id + "_desc"] = checkValue(v["description"]);
		});
	}
	getSectionIDs("powers", function(ids) {
		for(i = 0; i < ids.length; i++) {
			removeRepeatingRow("repeating_powers_" + ids[i]);
		}
	});
	getSectionIDs("attacks", function(ids) {
		for(i = 0; i < ids.length; i++) {
			removeRepeatingRow("repeating_attacks_" + ids[i]);
		}
	});
	getSectionIDs("abilities", function(ids) {
		for(i = 0; i < ids.length; i++) {
			removeRepeatingRow("repeating_abilities_" + ids[i]);
		}
	});
	setAttrs(u1, {"silent" : true}, function() {
		setAttrs(u2, null, closeModal);
	});
};

const formatOccupationSkills = function (s) { // s = compendium data string ; returns string
	return s
		.toLowerCase()
		.replaceAll("&nbsp;", " ")
		.replaceAll(", ", ",")
		.replace(/[ ][ ]+/g, " ")
		.replace(/[\(\)]/g, "")
		.replace(/[ /]/g, "-")
		.replaceAll("art-craft", "artcraft")
		.replaceAll("languages", "language")
		.replaceAll("sciences", "science");
};

const handleOccupationData = function(o, name) { // o = compendium data, name = string
	let u = {};
	if (o["skill_points"] != null) {
		let a = JSON.parse(o["skill_points"]);
		let b = {
			"strength" : "str",
			"dexterity" : "dex",
			"appearance" : "app",
			"power" : "pow"
		};
		let i, l, q, s, t = [];
		u["data-choice1"] = "";
		u["data-choice2"] = "";
		u["data-choice3"] = "";
		u["data-choice4"] = "";
		for (i = 0; i < a.length; i++) {
			l = a[i].replaceAll("&nbsp;", "").replaceAll(" ", "").replaceAll("+", "*").split("*");
			let c1 = "edu";
			let m1 = l[1] || "4";
			let c2 = l.length > 2 ? b[l[2]] || "" : "";
			let m2 = l.length > 2 ? l[3] || "0": "0";
			q = {
				"sk-pts-occ-mult1" : m1,
				"sk-pts-occ-char2" : c2,
				"sk-pts-occ-mult2" : m2
			};
			t.push(q);
			s = getLang(c1 + "-bb") + " × " + m1;
			if (l.length > 2 && c2 != "" && m2 != "0") s += " + " + getLang(c2) + " × " + m2;
			u["data-choice" + (i + 1)] = s;
		}
		u["data-buffer"] = JSON.stringify(t);
		if (a.length > 1) u["data-prompt"] = "2";
	}
	setAttrs(u, {"silent" : true}, function() {
		if (!Object.hasOwn(u, "data-prompt")) importOccupationData(o, name, 0);
	});
};

const importOccupationData = function(o, name, idx) { // o = compendium data, name = string, idx = number
	getAttrs(["data-buffer"], v => {
		let u1 = {}, u2 = {}, t = [];
		u1["tab"] = "2";
		u2["edit-mode"] = "1";
		u1["char-occupation"] = name;
		u1["char-era"] = checkValue(o["era"], "none") || "any"; // WARNING : no known Compendium value except "any"
		u1["char-lovecraftian"] = o["lovecraftian"] != null && o["lovecraftian"].toLowerCase() == "true" ? "1" : "0";
		u1["char-connections"] = checkValue(o["Suggested Contacts"], "none");
		u1["sk-credit-min"] = checkValue(o["credit_rating_min"], "num");
		u1["sk-credit-max"]= checkValue(o["credit_rating_max"], "num");
		if (o["skill_points"] != null) {
			if (idx > 0) idx -= 1;
			Object.assign(u2, JSON.parse(v["data-buffer"])[idx]);
		}
		if (o["skills"] != null) {
			let s = formatOccupationSkills(o["skills"]);
			let a = getAllSkills();
			let b = s.split(",");
			let i, j, l, q;
			for (i in a) u1[`sk-${a[i]}-occ`] = "0"; // reset occupation skills
			for (i = 0; i < b.length; i++) {
				if (b[i] == "fighting") {
					l = FightingSkills;
					for (j in l) {
						u1[`sk-${l[j]}-occ`] = "1";
						u1[`sk-${l[j]}-avl`] = "1";
					}
					t.push(getLang("sk-fighting"));
				} else if (b[i] == "firearms") {
					l = FirearmsSkills;
					for (j in l) {
						u1[`sk-${l[j]}-occ`] = "1";
						u1[`sk-${l[j]}-avl`] = "1";
					}
					t.push(getLang("sk-firearms"));
				} else if (b[i] == "artcraft-literature") {
					u1["sk-artcraft-custom1-name"] = getLang("sk-artcraft-literature");
					u1["sk-artcraft-custom1-occ"] = "1";
					u1["sk-artcraft-custom1-avl"] = "1";
					t.push(getLang("sk-artcraft") + " (" + u1["sk-artcraft-custom1-name"] + ")");
				} else if (b[i] == "language-latin") {
					u1["sk-language-other1-name"] = getLang("sk-language-latin");
					u1["sk-language-other1-occ"] = "1";
					u1["sk-language-other1-avl"] = "1";
					t.push(getLang("sk-language") + " (" + u1["sk-language-other1-name"] + ")");
				} else if (a.includes(b[i])) {
					u1[`sk-${b[i]}-occ`] = "1";
					u1[`sk-${b[i]}-avl`] = "1";
					q = getLang(`sk-${b[i]}`);
					if (b[i].startsWith("artcraft")) q = getLang("sk-artcraft") + " (" + q + ")";
					else if (b[i].startsWith("pilot")) q = getLang("sk-pilot") + " (" + q + ")";
					else if (b[i].startsWith("science")) q = getLang("sk-science") + " (" + q + ")";
					t.push(q);
				}
			}
		}
		if (o["skill_choices"] != null) {
			let a = JSON.parse(o["skill_choices"]);
			let i, j, s, k, q, p;
			for (i = 0; i < a.length; i++) {
				if (typeof a[i] === "object") { // is array
					p = "";
					for (j = 0; j < a[i].length; j++) {
						s = null;
						if ((/.*:\d/).test(a[i][j])) {
							s = a[i][j].split(":");
							k = formatOccupationSkills(s[0]);
						} else {
							k = formatOccupationSkills(a[i][j]);
						}
						q = getLang("sk-" + k) || a[i][j];
						if (k.startsWith("artcraft")) q = getLang("sk-artcraft") + ` (${q})`;
						else if (k.startsWith("pilot")) q = getLang("sk-pilot") + ` (${q})`;
						else if (k.startsWith("science")) q = getLang("sk-science") + ` (${q})`;
						p += q + (j < a[i].length - 1 ? ` ${getLang("sk-or")} ` : "");
						if (s != null) p += " (" + getLang("sk-" + s[1]) + " " + getLang("sk-choice") + ")";
					}
					if (p.length > 0) t.push(p);
				} else { // is string
					if (a[i] == "Languages:Own") {
						p = getLang("sk-language-own");
					} else {
						s = a[i].split(":");
						p = getLang("sk-" + (s[0] == "Any" ? "any" : formatOccupationSkills(s[0]) || s[0]));
						if (s[0] != "Interpersonal") p += " (" + getLang("sk-" + s[1]) + " " + getLang("sk-choice") + ")";
					}
					t.push(p);
				}
			}
		}
		if (t.length > 0) {
			let s = "", i;
			t = t.map(q => {
				return q
					.replace("É", "E1")
					.replace("é", "e1")
					.replace("È", "E2")
					.replace("è", "e2")
					.replace("Ê", "E3")
					.replace("ê", "e3");
			});
			t = t.sort();
			for (i = 0; i < t.length; i++) {
				s += t[i]
					.replace("E1", "É")
					.replace("e1", "é")
					.replace("E2", "È")
					.replace("e2", "è")
					.replace("E3", "Ê")
					.replace("e3", "ê");
				s += (i < t.length - 1 ? ", " : ".");
			}
			u1["sk-occ-list"] = s.charAt(0).toUpperCase() + s.substr(1);
		}
		setAttrs(u1, {"silent" : true}, function() {
			setAttrs(u2, null, closeModal);
		});
	});
};

const importSpellData = function(o, name) { // o = compendium data, name = string
	let u = {}, q, id;
	id = generateRowID();
	u["show-magic"] = "1";
	u["tab"] = "4";
	u["repeating_spells_" + id + "_name"] = name;
	if (o["costs"] != null) {
		q = JSON.parse(o["costs"]);
		u["repeating_spells_" + id + "_cost-mp"] = formatFormula(checkValue(q["magicpoints"], "num"), "spl-cost");
		u["repeating_spells_" + id + "_cost-san"] = formatFormula(checkValue(q["sanity"], "num"), "spl-cost");
		u["repeating_spells_" + id + "_cost-other"] = checkValue(q["other"], "none");
	}
	u["repeating_spells_" + id + "_cast-time"] = checkValue(o["casting_time"]);
	u["repeating_spells_" + id + "_desc"] = checkValue(o["description"]);
	u["repeating_spells_" + id + "_alt-names"] = "—";
	if (o["alternate_names"] != null) {
		q = JSON.parse(o["alternate_names"]);
		if (q.length > 0) u["repeating_spells_" + id + "_alt-names"] = q.join(", ");
	}
	u["repeating_spells_" + id + "_show-option"] = "1";
	setAttrs(u, {"silent" : true}, closeModal);
};

const importTalentData = function(o, name) { // o = compendium data, name = string
	let u1 = {}, u2 = {}, id;
	let a = {
		"miscellaneous" : "misc",
		"physical" : "physical",
		"mental" : "mental",
		"combat" : "combat"
	};
	id = generateRowID();
	u1["show-talents"] = "1";
	u1["tab"] = "6";
	u1["repeating_talents_" + id + "_name"] = name;
	u2["repeating_talents_" + id + "_type"] = o["type"] != null ? "tal-type-" + a[o["type"]] : "";
	u1["repeating_talents_" + id + "_desc"] = checkValue(o["description"]);
	u1["repeating_talents_" + id + "_show-option"] = "1";
	setAttrs(u1, {"silent" : true}, function() {
		setAttrs(u2, null, closeModal);
	});
};

on("change:data-drop", function(e) {
	if (e.sourceType == "player") {
		let o = JSON.parse(e.newValue);
		getAttrs(["data-name"], v => {
			let s = v["data-name"];
			switch(o.Category) {
				case "Monsters" : setAttrs({"data-prompt" : "1"}, {"silent" : true}); break;
				case "Occupations" : handleOccupationData(o, s); break;
				case "Items" : handleItemData(o, s); break;
				case "Spells" : importSpellData(o, s); break;
				case "Talents" : importTalentData(o, s); break;
			}
		});
	}
});

on("clicked:data-choice1 clicked:data-choice2 clicked:data-choice3 clicked:data-choice4 clicked:data-confirm", function(e) {
	let k = e.triggerName;
	let n = k.slice(0,-1).endsWith("data-choice") ? toInt(k.slice(-1)) : 0;
	getAttrs(["data-drop", "data-name", "data-prompt"], v => {
		switch(v["data-prompt"]) {
			case "1" :
			case "2" :
			case "3" : {
				let o = JSON.parse(v["data-drop"]);
				let s = v["data-name"];
				if (o.Category == "Monsters") importMonsterData(o, s);
				else if (o.Category == "Occupations") importOccupationData(o, s, n);
				else if (o.Category == "Items") importItemData(o, s, n);
				break;
			}
			case "4" : {
				resetSkillPoints(closeModal());
				break;
			}
			case "5" : {
				clearOccupationSkills(closeModal());
				break;
			}
		}
	});
});

on("clicked:data-cancel", closeModal);

// =============================================================================
// -----------------------------------------------------------------------------
// # Version
// -----------------------------------------------------------------------------
// =============================================================================

const initializeSheet = function () {
	let u1 = {};
	let u2 = {};
	let l = {};
	let id;
	let i;
	getSectionIDs("weapons", v => {
		l["weapons"] = v.length;
		getSectionIDs("spells", v => {
			l["spells"] = v.length;
			getSectionIDs("gear", v => {
				l["gear"] = v.length;
				getSectionIDs("assets", v => {
					l["assets"] = v.length;
					getSectionIDs("talents", v => {
						l["talents"] = v.length;
						getSectionIDs("notes", v => {
							l["notes"] = v.length;
							getSectionIDs("powers", v => {
								l["powers"] = v.length;
								getSectionIDs("attacks", v => {
									l["attacks"] = v.length;
									getSectionIDs("abilities", v => {
										l["abilities"] = v.length;
										for (i in l) {
											if (l[i] == 0) {
												id = generateRowID();
												if (i == "weapons") u2["repeating_" + i + "_" + id + "_name"] = getLang("lng-new");
												else u1["repeating_" + i + "_" + id + "_name"] = getLang("lng-new");
												if (i != "powers" && i != "abilities") u1["repeating_" + i + "_" + id + "_show-option"] = "1";
											}
										}
										u1["sheet-init"] = "1";
										setAttrs(u1, {"silent" : true}, function() {
											setAttrs(u2);
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
};

const checkVersion = function() {
	getAttrs(["sheet-version", "sheet-init", "sheet-lang"], v => {
		let n = parseFloat(v["sheet-version"]);
		let s = getTranslationLanguage();
		let b = false;
		let u = {};
		if (v["sheet-init"] == "0") {
			console.info("Achtung! Cthulhu (Coc 7th) Character Sheet being initialized"); // DEBUG
			initializeSheet();
		}
		if (v["sheet-lang"] != s) {
			updateCharacterSheetLanguage();
			u["sheet-lang"] = s;
			b = true;
		}
		if (n < Sheet.version) {
			console.info("Character Sheet updated to version " + Sheet.version);
			u["sheet-version"] = Sheet.version;
			b = true;
		} else {
			console.info("Achtung! Cthulhu (Coc 7th) Character Sheet v" + Sheet.version.toFixed(2) + " loaded");
		}
	if (b) setAttrs(u, {"silent" : true});
	});
};

// =============================================================================
// -----------------------------------------------------------------------------
// # Opening
// -----------------------------------------------------------------------------
// =============================================================================

on("sheet:opened", function(e) {
	checkVersion();
});
