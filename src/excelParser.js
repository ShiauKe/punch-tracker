const xlsx = require('xlsx')


class ExcelParser {

    constructor(filePath){
        this.filePath = filePath
        this.workbook=xlsx.readFile(filePath)
    }
    getAllSheetNames(){
        return this.workbook.SheetNames
    }
    getSheetDataByName(sheetName, ){
        const sheet = this.workbook.Sheets[sheetName]
        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found.`)
        }
        const sheetJson = xlsx.utils.sheet_to_json(sheet)
        return sheetJson
    }


}

module.exports = ExcelParser