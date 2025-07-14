// punchInfer.js
// 給定一個打卡序列 如果發現其中有u 則進行打卡推論
// 推論時，取u前後當作x,y, 根據以下的推論表進行推論
// 例如 x=mi, y=ai 則u=mo

const inferenceTable = {
    "":   { mi: 'mi', mo: 'mi', ai: 'mo', ao: 'ai', "": 'mi' },
    mi:   { "": 'mo', mo: 'mo', ai: 'mo' },
    mo:   { "": 'ai', ai: 'ai', ao: 'ai' },
    ai:   { "": 'ao', ao: 'ao' },
    ao:   { "": 'ao' },
    u:    { "": 'u', mi: 'mi', mo: 'mi', ai: 'mo', ao: 'ai' }
  };
  
  function inferOne(x, y) {
    x = x || "";
    y = y || "";
    return (inferenceTable[x] && inferenceTable[x][y]) || 'u';
  }
  
  function inferSequence(originalPunches) {
    const inferred_punches = [...originalPunches];
    // console.log(inferred_punches)
    for (let i = 0; i < originalPunches.length; i++) {
      inferred_punches[i].inferPunchStatus = inferred_punches[i].punchStatus

      if (inferred_punches[i] === 'u') {
        const x = i===0? "" :inferred_punches[i-1].punchStatus;
        // console.log(i)
        // console.log(originalPunches.length)
        const y = i+1===originalPunches.length ? "":inferred_punches[i+1].punchStatus;
        inferred_punches[i].inferPunchStatus = inferOne(x, y);
      }
    }

    return inferred_punches;
  }

    function inferSequence_v2(originalPunches) {
      // console.log('original',originalPunches)
    let inferred_punches = originalPunches.map(p => ({ ...p }));
    // console.log(inferred_punches)
    for (let i = 0; i < originalPunches.length; i++) {
      inferred_punches[i].inferPunchStatus = inferred_punches[i].punchStatus
    }
    console.log('inferred_punches',inferred_punches)
    for (let i = 0; i < originalPunches.length; i++) {
      if (inferred_punches[i].inferPunchStatus === 'u') {
        const x = i===0? "" :inferred_punches[i-1].inferPunchStatus;
        const y = i+1===originalPunches.length ? "":inferred_punches[i+1].inferPunchStatus;
        inferred_punches[i].inferPunchStatus = inferOne(x, y);
      }
    }
    console.log('inferred_punches after first pass',inferred_punches)
    
    if(inferred_punches.some(p=>p.inferPunchStatus==='u')) {
      console.log('still has u, inferring again', inferred_punches)
      return inferSequence_v2(inferred_punches)
    }else{
      return inferred_punches;
    }

  }

  function inferSequence_v3(originalPunches) {
  let inferred_punches = originalPunches.map(p => ({ ...p }));

  // 初始化：先複製 punchStatus 作為初始狀態
  for (let i = 0; i < inferred_punches.length; i++) {
    inferred_punches[i].inferPunchStatus = inferred_punches[i].punchStatus;
  }

  // 不斷迴圈推論，直到沒有任何變化
  let changed;
  do {
    changed = false;
    for (let i = 0; i < inferred_punches.length; i++) {
      if (inferred_punches[i].inferPunchStatus === 'u') {
        const x = i === 0 ? "" : inferred_punches[i - 1].inferPunchStatus;
        const y = i + 1 === inferred_punches.length ? "" : inferred_punches[i + 1].inferPunchStatus;
        const result = inferOne(x, y);
        if (result !== 'u') {
          inferred_punches[i].inferPunchStatus = result;
          changed = true;
        }
      }
    }
    // console.log(JSON.stringify(inferred_punches, null, 2));
  } while (changed);

  return inferred_punches;
}

  
  module.exports = { inferSequence, inferOne,inferSequence_v2,inferSequence_v3 };
  