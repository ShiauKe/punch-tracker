// punchClassifier.js
function timeToMinutes(t) {
    // console.log(t)
    try{
        const [h, m, s] = t.split(':').map(Number)
        return h * 60 *60 + m *60 + s
    }catch(error){
        console.log('error:', error)
    }
}
  
function classifyByRule(timeStr, ruleSet) {
    const tMin = timeToMinutes(timeStr)
    for (const [label, range] of Object.entries(ruleSet)) {
      const startMin = timeToMinutes(range.start)
      const endMin = timeToMinutes(range.end)
      if (tMin >= startMin && tMin <= endMin) return label
    }
    return 'u'
}
  
function getTimeDifference(Time1, Time2) {
    //單位是秒
    const t1 = timeToMinutes(Time1)
    const t2 = timeToMinutes(Time2)

    return t1 - t2
}
const onLeaveRules = {
    //根據晚到的分鐘數來決定要自動記錄請假多少小時
    0: 0,
    20: 0.5,
    30: 1,
    60: 1.5,
    90:2,
    120:2.5,
    150:3,
    180:3.5,
    210:4
};

const overTimeRules = {
    // 加班時間 10分鐘以內不算加班，故17:06打卡下班者不應計算加班5分鐘（例如陳秋娟20250318、王茹20250318等）。
    // 10分鐘之後每5分鐘計算一個單位，例如 17:12下班以17:10加班10分鐘計；17:26 下班以17:25加班
    // 25 分鐘計）。但公司人員例外（陳渝惠、朱映儒、張馨予），打卡時間超過15分鐘才計算。例如 17:12打下班，不計加班。
    standard:{
        map:{
            0: 0,
            10: 0,
            15: 10,
            20: 15,
            25: 20,
            30: 25,
            35: 30,
            40: 35,
            45: 40,
            50: 45,
            55: 50,
            60: 55,
            65: 60,
            70: 65,
            75: 70,
            80: 75,
            85: 80,
            90: 85,
            95:90,
            100:95
        }
    },
    special:{
        names:['陳渝惠','朱映儒','張馨予'],
         map:{
            0:0,
            10: 0,
            15: 0,
            20: 15,
            25: 20,
            30: 25,
            35: 30,
            40: 35,
            45: 40,
            50: 45,
            55: 50,
            60: 55,
            65: 60,
            70: 65,
            75: 70,
            80: 75,
            85: 80,
            90: 85,
            95:90,
            100:95
        }
    }

    //根據晚到的分鐘數來決定要自動記錄請假多少小時
};

function getOnLeaveValue(minLate, rules) {
  // 先取出所有 key，並轉成數字
  const keys = Object.keys(rules);
  const numericKeys = [];
  for (let i = 0; i < keys.length; i++) {
    numericKeys.push(Number(keys[i]));
  }

  // 找出所有小於等於 minLate 的 key
  const candidates = [];
  for (let i = 0; i < numericKeys.length; i++) {
    if (numericKeys[i] <= minLate) {
      candidates.push(numericKeys[i]);
    }
  }
  console.log(minLate,candidates)
  // 找出最大的那個 key
  let matchedKey = null;
  if (candidates.length > 0) {
    matchedKey = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      if (candidates[i] > matchedKey) {
        matchedKey = candidates[i];
      }
    }
  }

  // 回傳對應的值
  if (matchedKey !== null) {
    return rules[matchedKey];
  } else {
    return null; // 或其他 fallback 值
  }
}

function getOverTimeValue(name, minLate, rulesObj) {
  // 先取出所有 key，並轉成數字
    let rules = null;
  if(rulesObj.special.names.includes(name)){
    rules = rulesObj.special.map
  }else {
    rules = rulesObj.standard.map
  }

//   console.log(rules)
  const keys = Object.keys(rules);
  const numericKeys = [];
  for (let i = 0; i < keys.length; i++) {
    numericKeys.push(Number(keys[i]));
  }

  // 找出所有大於等於 minLate 的 key
  const candidates = [];
  for (let i = 0; i < numericKeys.length; i++) {
    if (numericKeys[i] >= minLate) {
      candidates.push(numericKeys[i]);
    }
  }
// console.log(minLate,candidates)
  // 找出最小的那個 key
  let matchedKey = null;
  if (candidates.length > 0) {
    matchedKey = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      if (candidates[i] < matchedKey) {
        matchedKey = candidates[i];
      }
    }
  }

  // 回傳對應的值
  if (matchedKey !== null) {
    return rules[matchedKey];
  } else {
    return null; // 或其他 fallback 值
  }
}

module.exports = {
    classifyByRule,
    getTimeDifference,
    onLeaveRules,
    overTimeRules,
    getOnLeaveValue,
    getOverTimeValue
}
  