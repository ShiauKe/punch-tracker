const fs = require('fs')
const path = require('path')
const excelParser = require('../excelParser')
const punchRule = require('./rules/punchRule')
const { classifyByRule ,getTimeDifference,onLeaveRules,overTimeRules,getOnLeaveValue,getOverTimeValue,specialEmployees} = require('./punchClassifier')
const { inferSequence_v3} = require('./punchInfer');
const abnormalSet = new Set([
    'u,mo,mo,u',
]);

const _ = require('lodash')
// 引入需要的套件

console.log('--------------------------------------')
const files = fs.readdirSync(path.join(__dirname,'raw'))
let final_results = {allData:[]}
files.forEach(file=>{
    if(file.endsWith('.xls') || file.endsWith('.xlsx')){
        processFile(file,final_results)
    }else{
        console.log('Skipping non-Excel file:',file)
    }
})
console.log('--------------------------------------')
console.log('Final results:',final_results.allData.length,'records')
fs.writeFileSync(`result_formatted.json`,JSON.stringify(final_results,null,2))
console.log('All records formatted and saved to JSON file.')

function processFile(filename,final_results) {
    const filePath = path.join(__dirname,'raw',filename)
    const parser = new excelParser(filePath)
    
    const allSheetsNames = parser.getAllSheetNames()
    const oneDayData = parser.getSheetDataByName(allSheetsNames[0])
    let all_records = get_all_records_formatted(oneDayData,filename)

    all_records.forEach(people=>{
        people.originalPunches = sortByTime(people.originalPunches)
        people.existAbnormalPunchStatus = recordAbnormalPunchStatus(people)
        people.inferRecords = inferSequence_v3(people.originalPunches)
        people = addFirstMarkAndNoPunchRegister(people)
        people = filter_in_final_punches(people)
        people = autoFillStartWorkTime(people)
    
        people = judgeLeaveStatus(people)
        people = judgeOverTimeStatus(people)
    })
    final_results.allData = [
        ...final_results.allData,
        {
            date: all_records[0].punchDate,
            data:all_records
        }
    ]
}

function sortByTime(originalPunches) {
    // 將打卡紀錄按照時間排序
    return originalPunches.sort((a, b) => a.time.localeCompare(b.time));
}
function get_all_records_formatted(oneDayData,filename){
    oneDayData.forEach(punchRecord=>{
        const punchTime = punchRecord['時間']
        const status = classifyByRule(punchTime, punchRule)
        punchRecord['punchStatus'] = status
    })
    
    const byNamePunchRecord = _.groupBy(oneDayData,'名稱')
    
    const groups_obj = _.mapValues(byNamePunchRecord, punchList =>
        punchList.map(p => ({
          time: p.時間,
          punchStatus: p.punchStatus
        }))
    );

    let punchDate = (filename) => {
                        const datePart = filename.split('.')[0].slice(3, 11) //
                        const year = datePart.slice(0, 4)
                        const month = datePart.slice(4, 6)
                        const day = datePart.slice(6, 8)
                        return `${year}-${month}-${day}`
                    }
    let all_records = []
    Object.keys(groups_obj).forEach(name=>{
        all_records=[...all_records,{
            punchDate: punchDate(filename),
            name:name,
            originalPunches:groups_obj[name]
        }]
    })

    return all_records
    
}
function isAbnormalPattern(seq) {
    return abnormalSet.has(seq.join(','));
}
function recordAbnormalPunchStatus(people){
    let result
    const punchRecord = people.originalPunches.map(originalPunch=>originalPunch.punchStatus)
    
    if(isAbnormalPattern(punchRecord)){
        result='Yes'
    }else{
        result='No'
    }
    // console.log(result)
    return result
}

function addFirstMarkAndNoPunchRegister(people){
    const targetPunches = {
        mi:null,
        mo:null,
        ai:null,
        ao:null,
    }
    
    people.inferRecords.forEach((item,index)=>{
        if(targetPunches[item.inferPunchStatus]===null){
            targetPunches[item.inferPunchStatus]=index
            item.isFirst = 'Yes'
        }
    })
    
    Object.keys(targetPunches).forEach(punch=>{
        if(targetPunches[punch]===null){
            people.inferRecords.push(
                {
                    'time':null,
                    'punchStatus':null,
                    'inferPunchStatus':punch,
                    'isFirst':'Yes',
                    'noPunchRegister':'Yes',
                }
            )
        }
    })
    return people
}

function filter_in_final_punches(people){
    people.final_punches = people.inferRecords.map(p => ({ ...p }))
    people.final_punches = people.final_punches.filter(item=>item.isFirst==='Yes')
    return people
}

function autoFillStartWorkTime(people){
    // console.log('people.name:',people.name)
    const mi = people.final_punches.find(p => p.inferPunchStatus === 'mi')
    const ai = people.final_punches.find(p => p.inferPunchStatus === 'ai')
    const mo = people.final_punches.find(p => p.inferPunchStatus === 'mo')
    const ao = people.final_punches.find(p => p.inferPunchStatus === 'ao')  

    if(mi.time !== null && mo.time === null){
        mo.time = punchRule["mo"].center
    }
    if(mo.time !== null && mi.time === null){
        mo.time = punchRule["mi"].center
    }
    if(ai.time !== null && ao.time === null){
        ao.time = punchRule["ao"].aux_fill
    }
    if(ao.time !== null && ai.time === null){
        ai.time = punchRule["ai"].center
    }
    return people
}

function judgeLeaveStatus(people){
    // console.log('people.name:',people.name
    // 補價的紀錄是獨立於final_punches之外的
    // 因為補價的計算牽涉到判斷mi,mo/ ai ao的兩兩配對是否皆為null
    people.onLeaveObj = {
        onLeave:'no',
        onLeaveDuration:0,
        onLeaveAutoFill:0
    }

    const mi = people.final_punches.find(p => p.inferPunchStatus === 'mi')
    const mo = people.final_punches.find(p => p.inferPunchStatus === 'mo')
    const ai = people.final_punches.find(p => p.inferPunchStatus === 'ai')
    const ao = people.final_punches.find(p => p.inferPunchStatus === 'ao')
    //如果早上（下午）打卡時間為空，則補假時間為4小時
    //並且將該時段對應的時間差都修改為0 
    if(mi.time===null && mo.time===null){
        people.onLeaveObj.onLeaveDuration += 4
        people.onLeaveObj.onLeaveAutoFill += 4
    }
    if(ai.time===null && ao.time===null){
        people.onLeaveObj.onLeaveDuration += 4
        people.onLeaveObj.onLeaveAutoFill += 4
    }
    //處理時間不為空的情況
    //傳入mi,mo,ai,ao的打卡紀錄以及補假規則, 計算並修改people.onLeaveObj的資料
    judgeOnLeave_v2(people, onLeaveRules)
    // console.log(people)
    return people
}

function judgeOnLeave_v2(people,onLeaveRules){
// 給定pepele, 由people.final_punches中的打卡紀錄來判斷補假規則
// 只要打卡紀錄不為空，就會根據打卡紀錄來判斷補假時數
// 將總共打卡的時間差加回people.onLeaveObj.onLeaveDuration
//只要打卡紀錄不為空,就計算跟標準上班時間的時間差並對照補假表修改加總補假時數
    const mi = people.final_punches.find(p => p.inferPunchStatus === 'mi')
    const mo = people.final_punches.find(p => p.inferPunchStatus === 'mo')
    const ai = people.final_punches.find(p => p.inferPunchStatus === 'ai')
    const ao = people.final_punches.find(p => p.inferPunchStatus === 'ao')


    if(mi.time>punchRule.mi.center){
        // console.log('mi.time:',mi.time)
        // people.onLeaveObj.onLeaveDuration += getTimeDifference(mi.time, punchRule.mi.center)/60
        const lateMinutes = getTimeDifference(mi.time, punchRule.mi.center)/60
        const onLeaveRegulation = getOnLeaveValue(lateMinutes,onLeaveRules)
        people.onLeaveObj.onLeaveDuration += lateMinutes
        people.onLeaveObj.onLeaveAutoFill += onLeaveRegulation
    }
    if(ai.time>punchRule.ai.center){
        // console.log('ai.time:',ai.time)
        // people.onLeaveObj.onLeaveDuration += getTimeDifference(ai.time, punchRule.ai.center)/60
        const lateMinutes = getTimeDifference(ai.time, punchRule.ai.center)/60
        const onLeaveRegulation = getOnLeaveValue(lateMinutes,onLeaveRules)
        people.onLeaveObj.onLeaveDuration += lateMinutes
        people.onLeaveObj.onLeaveAutoFill += onLeaveRegulation
    }
    if(mo.time<punchRule.mo.center){
        // console.log('mo.time:',mo.time)
        // people.onLeaveObj.onLeaveDuration += getTimeDifference(mo.time, punchRule.mo.center)/60
        const lateMinutes = getTimeDifference(punchRule.mo.center,mo.time)/60
        const onLeaveRegulation = getOnLeaveValue(lateMinutes,onLeaveRules)
        people.onLeaveObj.onLeaveDuration += lateMinutes
        people.onLeaveObj.onLeaveAutoFill += onLeaveRegulation
    }
    if(ao.time<punchRule.ao.center){
        // 下班時間早於標準下班時間
        // console.log('ao.time:',ao.time)
        // people.onLeaveObj.onLeaveDuration += getTimeDifference(ao.time, punchRule.ao.center)/60
        const lateMinutes = getTimeDifference(punchRule.ao.center,ao.time)/60
        const onLeaveRegulation = getOnLeaveValue(lateMinutes,onLeaveRules)
        people.onLeaveObj.onLeaveDuration += lateMinutes
        people.onLeaveObj.onLeaveAutoFill += onLeaveRegulation
    }
}


function judgeOverTimeStatus(people){
    people.overTimeObj = {
        overTimeAutoFill:0
    }

    const ao = people.final_punches.find(p=>p.inferPunchStatus==='ao')
    if(ao?.time>punchRule.ao.center){
        const overMinutes = getTimeDifference(ao.time,punchRule.ao.center)/60
        const overTimeRegulation = getOverTimeValue(people.name,overMinutes,overTimeRules,specialEmployees)
        people.overTimeObj.overTimeAutoFill += overTimeRegulation
    }

}
