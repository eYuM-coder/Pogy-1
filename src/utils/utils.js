const fs = require("node:fs");
const path = require("node:path");
const Profile = require("../database/models/economy/profile.js");
/**
 * Capitalizes a string
 * @param {string} string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Removes specifed array element
 * @param {Array} arr
 * @param {*} value
 */
function removeElement(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

/**
 * Trims array down to specified size
 * @param {Array} arr
 * @param {int} maxLen
 */
function trimArray(arr, maxLen = 10) {
  if (arr.length > maxLen) {
    const len = arr.length - maxLen;
    arr = arr.slice(0, maxLen);
    arr.push(`and **${len}** more...`);
  }
  return arr;
}

module.exports.getAllFiles = function getAllFiles(dirPath, arrayOfFiles)
  {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory())
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      else arrayOfFiles.push(path.join(dirPath, "/", file));
    });

    return arrayOfFiles;
  };

/**
 * Trims joined array to specified size
 * @param {Array} arr
 * @param {int} maxLen
 * @param {string} joinChar
 */
function trimStringFromArray(arr, maxLen = 2048, joinChar = "\n") {
  let string = arr.join(joinChar);
  const diff = maxLen - 15; // Leave room for "And ___ more..."
  if (string.length > maxLen) {
    string = string.slice(0, string.length - (string.length - diff));
    string = string.slice(0, string.lastIndexOf(joinChar));
    string =
      string + `\nAnd **${arr.length - string.split("\n").length}** more...`;
  }
  return string;
}

/**
 * Gets current array window range
 * @param {Array} arr
 * @param {int} current
 * @param {int} interval
 */
function getRange(arr, current, interval) {
  const max = arr.length > current + interval ? current + interval : arr.length;
  current = current + 1;
  const range =
    arr.length == 1 || arr.length == current || interval == 1
      ? `[${current}]`
      : `[${current} - ${max}]`;
  return range;
}

/**
 * Gets the ordinal numeral of a number
 * @param {int} number
 */
function getOrdinalNumeral(number) {
  number = number.toString();
  if (number === "11" || number === "12" || number === "13")
    return number + "th";
  if (number.endsWith(1)) return number + "st";
  else if (number.endsWith(2)) return number + "nd";
  else if (number.endsWith(3)) return number + "rd";
  else return number + "th";
}

/**
 * Gets the next moderation case number
 * @param {Client} client
 * @param {Guild} guild
 */
async function getCaseNumber(client, guild, modLog) {
  const message = (await modLog.messages.fetch({ limit: 100 }))
    .filter(
      (m) =>
        m.member === guild.members.me &&
        m.embeds[0] &&
        m.embeds[0].type == "rich" &&
        m.embeds[0].footer &&
        m.embeds[0].footer.text &&
        m.embeds[0].footer.text.startsWith("Case")
    )
    .first();

  if (message) {
    const footer = message.embeds[0].footer.text;
    const num = parseInt(footer.split("#").pop());
    if (!isNaN(num)) return num + 1;
  }

  return 1;
}

/**
 * Gets current status
 * @param {...*} args
 */
function getStatus(...args) {
  for (const arg of args) {
    if (!arg) return "disabled";
  }
  return "enabled";
}

async function createProfile(user) {
  const profile = await Profile.findOne({ userID: user.id });
  if (!profile) {
    const newProfile = await new Profile({
      userID: user.id,
      wallet: 0,
      bank: 0,
      bankCapacity: 5000,
      lastDaily: new Date() - 86400000,
      lastWeekly: new Date() - 604800000,
      lastMonthly: new Date() - 2592000000,
      lastBeg: new Date() - 180000,
      lastRobbed: new Date() - 600000,
      passiveUpdated: new Date()
    })
    newProfile.save().catch(() => {});
    return true;
  }
  return false;
}

module.exports = {
  capitalize,
  removeElement,
  trimArray,
  trimStringFromArray,
  getRange,
  getOrdinalNumeral,
  getCaseNumber,
  getStatus,
  createProfile,
};
